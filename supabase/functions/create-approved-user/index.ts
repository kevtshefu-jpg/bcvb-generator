import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type RegistrationRequestRow = {
  id: string
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  birth_year?: number | string | null
  category_requested?: string | null
  requested_category?: string | null
  role_requested?: string | null
  requested_role?: string | null
  requested_team?: string | null
  notes?: string | null
  status?: string | null
  created_at?: string | null
}

type CreateApprovedUserPayload = {
  requestId?: string
  id?: string
  finalRole?: string
  role?: string
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function normalizeText(value: unknown) {
  return String(value || '').trim()
}

function normalizeEmail(value: unknown) {
  return normalizeText(value).toLowerCase()
}

function isMissingColumnError(message: string) {
  const value = message.toLowerCase()

  return (
    value.includes('could not find') ||
    value.includes('schema cache') ||
    (value.includes('column') && value.includes('does not exist'))
  )
}

function isDuplicateUserError(message: string) {
  const value = message.toLowerCase()

  return (
    value.includes('already registered') ||
    value.includes('already been registered') ||
    value.includes('already exists') ||
    value.includes('duplicate') ||
    value.includes('user already')
  )
}

function normalizeRole(value: unknown) {
  const raw = normalizeText(value).toLowerCase()

  if (!raw) return 'member'

  if (raw.includes('responsable')) return 'responsable_technique'
  if (raw.includes('admin')) return 'admin'
  if (raw.includes('coach')) return 'coach'
  if (raw.includes('aide')) return 'coach'
  if (raw.includes('dirigeant')) return 'dirigeant'
  if (raw.includes('parent référent') || raw.includes('parent_referent')) return 'parent_referent'
  if (raw.includes('parent')) return 'parent'
  if (raw.includes('joueur')) return 'joueur'
  if (raw.includes('bénévole') || raw.includes('benevole')) return 'benevole'
  if (raw.includes('arbitre')) return 'arbitre'
  if (raw.includes('otm')) return 'otm'
  if (raw.includes('membre')) return 'member'
  if (raw.includes('member')) return 'member'

  return raw.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'member'
}

function buildFullName(row: RegistrationRequestRow) {
  const firstName = normalizeText(row.first_name)
  const lastName = normalizeText(row.last_name)
  const fullName = `${firstName} ${lastName}`.trim()

  return fullName || normalizeEmail(row.email) || 'Membre BCVB'
}

function makeTemporaryPassword() {
  const values = new Uint32Array(4)
  crypto.getRandomValues(values)

  return `BCVB-${Array.from(values)
    .map((value) => value.toString(36))
    .join('-')}!a7`
}

async function findAuthUserByEmail(
  supabaseAdmin: ReturnType<typeof createClient>,
  email: string,
) {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  if (error) {
    throw new Error(`Recherche utilisateur Auth impossible : ${error.message}`)
  }

  return data.users.find((user) => normalizeEmail(user.email) === email) || null
}

async function assertAdminCaller(
  supabaseAdmin: ReturnType<typeof createClient>,
  authorization: string | null,
) {
  const token = authorization?.replace('Bearer ', '').trim()

  if (!token) {
    throw new Error('Utilisateur non authentifié.')
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)

  if (userError || !userData.user) {
    throw new Error('Session invalide ou expirée.')
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, role, is_active')
    .eq('id', userData.user.id)
    .maybeSingle()

  if (profileError) {
    throw new Error(`Impossible de vérifier les droits : ${profileError.message}`)
  }

  const role = normalizeRole(profile?.role)

  if (!profile?.is_active) {
    throw new Error('Compte administrateur inactif.')
  }

  if (role !== 'admin' && role !== 'responsable_technique') {
    throw new Error('Droits insuffisants pour créer un compte.')
  }

  return userData.user
}

async function updateRegistrationStatus(
  supabaseAdmin: ReturnType<typeof createClient>,
  requestId: string,
  status: 'approved' | 'rejected',
) {
  const { error } = await supabaseAdmin
    .from('registration_requests')
    .update({ status })
    .eq('id', requestId)

  if (error) {
    throw new Error(`Compte créé, mais demande non mise à jour : ${error.message}`)
  }
}

async function updateProfileRequestStatus(
  supabaseAdmin: ReturnType<typeof createClient>,
  email: string,
  status: 'approved' | 'rejected',
) {
  const fullPatch = {
    status,
    decided_at: new Date().toISOString(),
  }

  const { error } = await supabaseAdmin
    .from('profile_requests')
    .update(fullPatch)
    .eq('email', email)

  if (!error) return

  if (!isMissingColumnError(error.message)) {
    console.warn('[create-approved-user] profile_requests update skipped:', error.message)
    return
  }

  const { error: fallbackError } = await supabaseAdmin
    .from('profile_requests')
    .update({ status })
    .eq('email', email)

  if (fallbackError && !isMissingColumnError(fallbackError.message)) {
    console.warn(
      '[create-approved-user] profile_requests fallback skipped:',
      fallbackError.message,
    )
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Méthode non autorisée.' }, 405)
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(
        {
          ok: false,
          error:
            'Configuration Supabase incomplète : SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant.',
        },
        500,
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    await assertAdminCaller(supabaseAdmin, request.headers.get('Authorization'))

    const payload = (await request.json()) as CreateApprovedUserPayload
    const requestId = normalizeText(payload.requestId || payload.id)

    if (!requestId) {
      return jsonResponse({ ok: false, error: 'requestId manquant.' }, 400)
    }

    const { data: requestRow, error: requestError } = await supabaseAdmin
      .from('registration_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (requestError || !requestRow) {
      return jsonResponse(
        {
          ok: false,
          error: `Demande introuvable : ${requestError?.message || 'aucune donnée'}`,
        },
        404,
      )
    }

    const registrationRequest = requestRow as RegistrationRequestRow

    const email = normalizeEmail(registrationRequest.email)
    const fullName = buildFullName(registrationRequest)
    const finalRole = normalizeRole(
      payload.finalRole ||
        payload.role ||
        registrationRequest.role_requested ||
        registrationRequest.requested_role ||
        'member',
    )

    if (!email) {
      return jsonResponse({ ok: false, error: 'Email manquant dans la demande.' }, 400)
    }

    let userId: string | null = null
    let userAlreadyExisted = false
    const temporaryPassword = makeTemporaryPassword()

    const { data: createdUserData, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: finalRole,
          source: 'bcvb_registration_approval',
        },
      })

    if (createUserError) {
      if (!isDuplicateUserError(createUserError.message)) {
        return jsonResponse(
          {
            ok: false,
            error: `Création du compte Auth impossible : ${createUserError.message}`,
          },
          500,
        )
      }

      userAlreadyExisted = true

      const existingAuthUser = await findAuthUserByEmail(supabaseAdmin, email)

      if (!existingAuthUser?.id) {
        return jsonResponse(
          {
            ok: false,
            error:
              'Un utilisateur existe peut-être déjà, mais impossible de le retrouver dans Supabase Auth.',
          },
          409,
        )
      }

      userId = existingAuthUser.id
    } else {
      userId = createdUserData.user?.id || null
    }

    if (!userId) {
      return jsonResponse(
        {
          ok: false,
          error: "Impossible de récupérer l'identifiant utilisateur.",
        },
        500,
      )
    }

    const profilePayload = {
      id: userId,
      email,
      full_name: fullName,
      role: finalRole,
      is_active: true,
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' })

    if (profileError) {
      return jsonResponse(
        {
          ok: false,
          error: `Compte Auth créé, mais profil club impossible à enregistrer : ${profileError.message}`,
        },
        500,
      )
    }

    await updateRegistrationStatus(supabaseAdmin, requestId, 'approved')
    await updateProfileRequestStatus(supabaseAdmin, email, 'approved')

    let passwordResetLink: string | null = null

    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
      })

    if (!linkError && linkData?.properties?.action_link) {
      passwordResetLink = linkData.properties.action_link
    }

    return jsonResponse({
      ok: true,
      userId,
      email,
      fullName,
      role: finalRole,
      userAlreadyExisted,
      passwordResetLink,
      message: userAlreadyExisted
        ? 'Le compte existant a été rattaché et le profil club a été activé.'
        : 'Le compte utilisateur et le profil club ont été créés.',
    })
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue.',
      },
      500,
    )
  }
})