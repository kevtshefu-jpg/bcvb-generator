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

type EmailContact = {
  name: string
  email: string
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

function parseEmailFrom(value?: string | null): EmailContact {
  const fallback = {
    name: 'BCVB Référentiel',
    email: 'kevtshefu@gmail.com',
  }

  const raw = normalizeText(value)
  if (!raw) return fallback

  const bracketMatch = raw.match(/^(.*?)<([^<>@\s]+@[^<>@\s]+)>$/)
  if (bracketMatch) {
    return {
      name: normalizeText(bracketMatch[1]) || fallback.name,
      email: normalizeEmail(bracketMatch[2]) || fallback.email,
    }
  }

  const emailMatch = raw.match(/([^\s<>@]+@[^\s<>@]+)$/)
  if (!emailMatch) return fallback

  return {
    name: normalizeText(raw.slice(0, emailMatch.index).replace(/[<>]/g, '')) || fallback.name,
    email: normalizeEmail(emailMatch[1]) || fallback.email,
  }
}

function getEmailSender() {
  return parseEmailFrom(
    Deno.env.get('EMAIL_FROM') || 'BCVB Référentiel kevtshefu@gmail.com',
  )
}

function getReplyTo() {
  const replyToEmail =
    normalizeEmail(Deno.env.get('REPLY_TO_EMAIL')) ||
    normalizeEmail(Deno.env.get('ADMIN_NOTIFICATION_EMAIL')) ||
    'kevtshefu@gmail.com'

  return {
    name: 'Kevin Tshefu',
    email: replyToEmail,
  }
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

function getSiteUrl() {
  return (
    normalizeText(Deno.env.get('SITE_URL')) ||
    normalizeText(Deno.env.get('PUBLIC_SITE_URL')) ||
    'https://bcvb-generator-ds72.vercel.app'
  ).replace(/\/+$/, '')
}

function getActivationRedirectUrl() {
  return `${getSiteUrl()}/reinitialisation-mot-de-passe`
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

async function updateRegistrationApprovalStatus(
  supabaseAdmin: ReturnType<typeof createClient>,
  requestId: string,
  approvedBy: string,
  activationEmailStatus: 'sent' | 'failed',
) {
  const now = new Date().toISOString()
  const fullPatch = {
    status: 'approved',
    approved_by: approvedBy,
    approved_at: now,
    activation_email_sent_at: activationEmailStatus === 'sent' ? now : null,
    activation_email_status: activationEmailStatus,
  }

  const { error } = await supabaseAdmin
    .from('registration_requests')
    .update(fullPatch)
    .eq('id', requestId)

  if (!error) return

  if (isMissingColumnError(error.message)) {
    const { error: fallbackError } = await supabaseAdmin
      .from('registration_requests')
      .update({ status: 'approved' })
      .eq('id', requestId)

    if (fallbackError) {
      throw new Error(`Compte créé, mais demande non mise à jour : ${fallbackError.message}`)
    }

    return
  }

  throw new Error(`Compte créé, mais demande non mise à jour : ${error.message}`)
}

async function upsertProfileWithFallback(
  supabaseAdmin: ReturnType<typeof createClient>,
  profilePayload: Record<string, unknown>,
  optionalPayload: Record<string, unknown>,
) {
  const { error } = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        ...profilePayload,
        ...optionalPayload,
      },
      { onConflict: 'id' },
    )

  if (!error) return

  if (!isMissingColumnError(error.message)) {
    throw new Error(
      `Compte Auth créé, mais profil club impossible à enregistrer : ${error.message}`,
    )
  }

  const { error: fallbackError } = await supabaseAdmin
    .from('profiles')
    .upsert(profilePayload, { onConflict: 'id' })

  if (fallbackError) {
    throw new Error(
      `Compte Auth créé, mais profil club impossible à enregistrer : ${fallbackError.message}`,
    )
  }
}

async function generateActivationLink(
  supabaseAdmin: ReturnType<typeof createClient>,
  email: string,
  redirectTo: string,
) {
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo,
    },
  })

  if (error) {
    throw new Error(`Lien d’activation impossible à générer : ${error.message}`)
  }

  const actionLink = data.properties?.action_link
  if (!actionLink) {
    throw new Error('Lien d’activation absent dans la réponse Supabase.')
  }

  return actionLink
}

async function sendActivationEmail(email: string, fullName: string, activationLink: string) {
  const apiKey = Deno.env.get('BREVO_API_KEY')
  if (!apiKey) throw new Error('BREVO_API_KEY manquant.')

  const htmlContent = `
    <p>Bonjour ${fullName},</p>
    <p>Votre accès au référentiel BCVB a été validé.</p>
    <p>Vous pouvez créer votre mot de passe avec ce lien sécurisé :</p>
    <p><a href="${activationLink}">Créer mon mot de passe</a></p>
    <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>${activationLink}</p>
    <p>À bientôt,<br>BCVB Référentiel</p>
  `

  const textContent = [
    `Bonjour ${fullName},`,
    '',
    'Votre accès au référentiel BCVB a été validé.',
    'Vous pouvez créer votre mot de passe avec ce lien sécurisé :',
    activationLink,
    '',
    'À bientôt,',
    'BCVB Référentiel',
  ].join('\n')

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: getEmailSender(),
      to: [{ email, name: fullName }],
      replyTo: getReplyTo(),
      subject: 'BCVB — Créez votre mot de passe',
      htmlContent,
      textContent,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Brevo a refusé l'email d’activation (${response.status}) : ${detail}`)
  }

  return response.json()
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

    const adminUser = await assertAdminCaller(
      supabaseAdmin,
      request.headers.get('Authorization'),
    )

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
    const activationRedirectTo = getActivationRedirectUrl()
    const now = new Date().toISOString()
    let activationEmailStatus: 'sent' | 'failed' = 'failed'
    let activationEmailError: string | null = null

    const existingAuthUser = await findAuthUserByEmail(supabaseAdmin, email)
    if (existingAuthUser?.id) {
      userAlreadyExisted = true
      userId = existingAuthUser.id
    }

    if (!userId && !userAlreadyExisted) {
      const { data: createdUserData, error: createUserError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            role: finalRole,
            source: 'bcvb_registration_approval',
          },
        })

      if (createUserError) {
        return jsonResponse(
          {
            ok: false,
            error: `Création du compte Auth impossible : ${createUserError.message}`,
          },
          500,
        )
      }

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

    const { data: existingProfile, error: existingProfileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, is_active')
      .eq('id', userId)
      .maybeSingle()

    if (existingProfileError) {
      return jsonResponse(
        {
          ok: false,
          error: `Impossible de vérifier le profil existant : ${existingProfileError.message}`,
        },
        500,
      )
    }

    const protectedRoles = ['admin', 'responsable_technique']

    const existingRole = normalizeRole(existingProfile?.role)
    const shouldKeepExistingRole = protectedRoles.includes(existingRole)

    const finalProfileRole = shouldKeepExistingRole ? existingRole : finalRole

    const profilePayload = {
      id: userId,
      email,
      full_name: fullName,
      role: finalProfileRole,
      is_active: true,
    }

    await upsertProfileWithFallback(supabaseAdmin, profilePayload, {
      invitation_sent_at: userAlreadyExisted ? null : now,
      last_password_reset_sent_at: userAlreadyExisted ? now : null,
      onboarding_completed: false,
    })

    try {
      const activationLink = await generateActivationLink(
        supabaseAdmin,
        email,
        activationRedirectTo,
      )
      await sendActivationEmail(email, fullName, activationLink)
      activationEmailStatus = 'sent'
    } catch (error) {
      activationEmailError = error instanceof Error ? error.message : String(error)
      console.error('[create-approved-user] activation email failed:', error)
    }

    await updateRegistrationApprovalStatus(
      supabaseAdmin,
      requestId,
      adminUser.id,
      activationEmailStatus,
    )
    await updateProfileRequestStatus(supabaseAdmin, email, 'approved')

    return jsonResponse({
      ok: true,
      user_id: userId,
      userId,
      email,
      full_name: fullName,
      fullName,
      role: finalProfileRole,
      user_already_existed: userAlreadyExisted,
      userAlreadyExisted,
      email_sent: activationEmailStatus === 'sent',
      activation_email_status: activationEmailStatus,
      activation_email_error: activationEmailError,
      message:
        activationEmailStatus === 'sent'
          ? 'Compte créé et email d’activation envoyé.'
          : 'Compte créé, mais l’email d’activation n’a pas pu être envoyé.',
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
