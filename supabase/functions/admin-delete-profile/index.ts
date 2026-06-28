import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type AdminProfileAction = 'deactivate' | 'reactivate' | 'delete'

type ActionPayload = {
  profileId?: string
  action?: AdminProfileAction
}

type ProfileRow = {
  id: string
  email?: string | null
  full_name?: string | null
  role?: string | null
  is_active?: boolean | null
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

function normalizeRole(value: unknown) {
  const role = normalizeText(value).toLowerCase()
  if (role === 'technical_manager') return 'responsable_technique'
  if (role === 'membre') return 'member'
  return role || 'member'
}

function isAdminRole(value: unknown) {
  return ['admin', 'responsable_technique'].includes(normalizeRole(value))
}

function isMissingColumnError(message: string) {
  const value = message.toLowerCase()

  return (
    value.includes('could not find') ||
    value.includes('schema cache') ||
    (value.includes('column') && value.includes('does not exist'))
  )
}

function getBearerToken(request: Request) {
  return normalizeText(request.headers.get('Authorization')).replace(/^Bearer\s+/i, '')
}

async function getCallerProfile(
  supabaseAdmin: ReturnType<typeof createClient>,
  token: string,
) {
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)

  if (userError || !userData.user) {
    throw new Error('Session invalide ou expirée.')
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, role, is_active')
    .eq('id', userData.user.id)
    .maybeSingle()

  if (profileError) {
    throw new Error(`Impossible de vérifier les permissions : ${profileError.message}`)
  }

  if (!profile?.is_active || !isAdminRole(profile.role)) {
    throw new Error('Permission refusée : rôle admin requis.')
  }

  return profile as ProfileRow
}

async function getTargetProfile(
  supabaseAdmin: ReturnType<typeof createClient>,
  profileId: string,
) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, role, is_active')
    .eq('id', profileId)
    .maybeSingle()

  if (error) {
    throw new Error(`Profil cible introuvable : ${error.message}`)
  }

  if (!data) {
    throw new Error('Profil cible introuvable.')
  }

  return data as ProfileRow
}

async function assertNotLastActiveAdmin(
  supabaseAdmin: ReturnType<typeof createClient>,
  targetProfile: ProfileRow,
  action: AdminProfileAction,
) {
  if (action === 'reactivate') return
  if (!targetProfile.is_active || !isAdminRole(targetProfile.role)) return

  const { count, error } = await supabaseAdmin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)
    .in('role', ['admin', 'responsable_technique'])

  if (error) {
    throw new Error(`Impossible de vérifier les admins actifs : ${error.message}`)
  }

  if ((count || 0) <= 1) {
    throw new Error('Action refusée : impossible de supprimer ou désactiver le dernier admin actif.')
  }
}

async function updateProfileStatus(
  supabaseAdmin: ReturnType<typeof createClient>,
  profileId: string,
  isActive: boolean,
) {
  const fullPatch = {
    is_active: isActive,
    profile_status: isActive ? 'active' : 'inactive',
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update(fullPatch)
    .eq('id', profileId)

  if (!error) return

  if (!isMissingColumnError(error.message)) {
    throw new Error(`Mise à jour du profil impossible : ${error.message}`)
  }

  const { error: fallbackError } = await supabaseAdmin
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', profileId)

  if (fallbackError) {
    throw new Error(`Mise à jour du profil impossible : ${fallbackError.message}`)
  }
}

async function deleteProfileAndAuthUser(
  supabaseAdmin: ReturnType<typeof createClient>,
  profileId: string,
) {
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(profileId)

  if (authError) {
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', profileId)
      .maybeSingle()

    const message = authError.message || 'Suppression Auth impossible.'

    if (existingProfile) {
      throw new Error(`Suppression du compte Auth impossible, profil conservé : ${message}`)
    }

    throw new Error(`Suppression du compte Auth impossible : ${message}`)
  }

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', profileId)

  if (profileError) {
    throw new Error(`Compte Auth supprimé, mais suppression du profil impossible : ${profileError.message}`)
  }
}

async function writeAuditLog(
  supabaseAdmin: ReturnType<typeof createClient>,
  input: {
    actor: ProfileRow
    target: ProfileRow
    action: AdminProfileAction
  },
) {
  const metadata = {
    actor_id: input.actor.id,
    actor_email: input.actor.email,
    target_id: input.target.id,
    target_email: input.target.email,
    target_role: input.target.role,
    action: input.action,
  }

  try {
    const { error } = await supabaseAdmin
      .from('admin_audit_logs')
      .insert({
        actor_id: input.actor.id,
        target_id: input.target.id,
        action: `profile_${input.action}`,
        metadata,
        created_at: new Date().toISOString(),
      })

    if (!error) return
    console.warn('[admin-delete-profile] admin_audit_logs skipped:', error.message)
  } catch (error) {
    console.warn('[admin-delete-profile] admin_audit_logs unavailable:', error)
  }

  try {
    const { error } = await supabaseAdmin
      .from('admin_notifications')
      .insert({
        type: `profile_${input.action}`,
        title: `Profil ${input.action}`,
        message: `${input.actor.email || input.actor.id} a exécuté ${input.action} sur ${input.target.email || input.target.id}.`,
        recipient_role: 'admin',
        metadata,
      })

    if (error) {
      console.warn('[admin-delete-profile] admin_notifications skipped:', error.message)
    }
  } catch (error) {
    console.warn('[admin-delete-profile] admin_notifications unavailable:', error)
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
      return jsonResponse({ ok: false, error: 'Configuration Supabase incomplète.' }, 500)
    }

    const token = getBearerToken(request)
    if (!token) {
      return jsonResponse({ ok: false, error: 'Session admin manquante.' }, 401)
    }

    const payload = (await request.json()) as ActionPayload
    const profileId = normalizeText(payload.profileId)
    const action = payload.action

    if (!profileId) {
      return jsonResponse({ ok: false, error: 'profileId manquant.' }, 400)
    }

    if (!action || !['deactivate', 'reactivate', 'delete'].includes(action)) {
      return jsonResponse({ ok: false, error: 'Action profil invalide.' }, 400)
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const callerProfile = await getCallerProfile(supabaseAdmin, token)
    const targetProfile = await getTargetProfile(supabaseAdmin, profileId)

    if (callerProfile.id === targetProfile.id) {
      return jsonResponse(
        { ok: false, error: 'Action refusée : impossible de modifier votre propre profil.' },
        403,
      )
    }

    await assertNotLastActiveAdmin(supabaseAdmin, targetProfile, action)

    if (action === 'deactivate') {
      await updateProfileStatus(supabaseAdmin, profileId, false)
    } else if (action === 'reactivate') {
      await updateProfileStatus(supabaseAdmin, profileId, true)
    } else {
      await deleteProfileAndAuthUser(supabaseAdmin, profileId)
    }

    await writeAuditLog(supabaseAdmin, {
      actor: callerProfile,
      target: targetProfile,
      action,
    })

    return jsonResponse({
      ok: true,
      profile_id: profileId,
      action,
    })
  } catch (error) {
    console.error('[admin-delete-profile] action failed:', error)

    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Erreur admin inconnue.',
      },
      400,
    )
  }
})
