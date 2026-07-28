import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import {
  isAdminAssignableRole,
  type AdminAssignableRole,
} from '../_shared/adminProfileRoles.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type AdminProfileAction = 'deactivate' | 'reactivate' | 'delete' | 'update_role'

type ActionPayload = {
  profileId?: string
  action?: AdminProfileAction
  role?: string
}

type ProfileRow = {
  id: string
  email?: string | null
  full_name?: string | null
  role?: string | null
  is_active?: boolean | null
  profile_status?: string | null
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

function isStrictAdminRole(value: unknown) {
  return normalizeRole(value) === 'admin'
}

function isMissingAuthUserError(message: string) {
  const value = message.toLowerCase()

  return (
    value.includes('user not found') ||
    value.includes('not found') ||
    value.includes('no user')
  )
}

function getBearerToken(request: Request) {
  return normalizeText(request.headers.get('Authorization')).replace(/^Bearer\s+/i, '')
}

async function getCallerProfile(
  supabaseUser: ReturnType<typeof createClient>,
  supabaseAdmin: ReturnType<typeof createClient>,
) {
  const { data: userData, error: userError } = await supabaseUser.auth.getUser()

  if (userError || !userData.user) {
    throw new Error('Session invalide ou expirée.')
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, role, is_active, profile_status')
    .eq('id', userData.user.id)
    .maybeSingle()

  if (profileError) {
    throw new Error(`Impossible de vérifier les permissions : ${profileError.message}`)
  }

  if (!profile?.is_active || profile.profile_status !== 'active' || !isStrictAdminRole(profile.role)) {
    throw new Error('Vous n’avez pas les droits administrateur.')
  }

  return profile as ProfileRow
}

async function getTargetProfile(
  supabaseAdmin: ReturnType<typeof createClient>,
  profileId: string,
) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, role, is_active, profile_status')
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
  nextRole?: AdminAssignableRole,
) {
  if (action === 'reactivate') return
  if (
    !targetProfile.is_active ||
    targetProfile.profile_status !== 'active' ||
    normalizeRole(targetProfile.role) !== 'admin'
  ) return
  if (action === 'update_role' && nextRole === 'admin') return

  const { count, error } = await supabaseAdmin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)
    .eq('profile_status', 'active')
    .eq('role', 'admin')

  if (error) {
    throw new Error(`Impossible de vérifier les admins actifs : ${error.message}`)
  }

  if ((count || 0) <= 1) {
    throw new Error('Impossible de modifier ou suspendre le dernier administrateur actif.')
  }
}

async function updateProfileStatus(
  supabaseAdmin: ReturnType<typeof createClient>,
  profileId: string,
  isActive: boolean,
) {
  const fullPatch = {
    is_active: isActive,
    profile_status: isActive ? 'active' : 'suspended',
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update(fullPatch)
    .eq('id', profileId)

  if (error) throw new Error(`Mise à jour du profil impossible : ${error.message}`)
}

async function updateProfileRole(
  supabaseAdmin: ReturnType<typeof createClient>,
  profileId: string,
  role: AdminAssignableRole,
) {
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', profileId)

  if (error) throw new Error(`Modification du rôle impossible : ${error.message}`)
}

async function deleteProfileAndAuthUser(
  supabaseAdmin: ReturnType<typeof createClient>,
  profileId: string,
) {
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(profileId)
  let warning: string | null = null

  if (authError) {
    if (isMissingAuthUserError(authError.message)) {
      console.warn(
        '[admin-delete-profile] Auth user already missing, public profile deleted:',
        authError.message,
      )

      warning = 'Profil supprimé. Le compte Auth était déjà absent.'
    } else {
      const { data: stillExists } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', profileId)
        .maybeSingle()

      if (stillExists) {
        throw new Error(`Suppression du compte Auth impossible, profil conservé : ${authError.message}`)
      }

      throw new Error(`Suppression du compte Auth impossible : ${authError.message}`)
    }
  }

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', profileId)

  if (profileError) {
    throw new Error(`Compte Auth supprimé, mais suppression du profil impossible : ${profileError.message}`)
  }

  return warning ? { warning } : null
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
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return jsonResponse({ ok: false, error: 'Configuration Supabase incomplète.' }, 500)
    }

    const token = getBearerToken(request)
    if (!token) {
      return jsonResponse({ ok: false, error: 'Session admin manquante.' })
    }

    const payload = (await request.json()) as ActionPayload
    const profileId = normalizeText(payload.profileId)
    const action = payload.action

    if (!profileId) {
      return jsonResponse({ ok: false, error: 'profileId manquant.' })
    }

    if (!action || !['deactivate', 'reactivate', 'delete', 'update_role'].includes(action)) {
      return jsonResponse({ ok: false, error: 'Action profil invalide.' })
    }

    const requestedRole = action === 'update_role' ? payload.role : undefined
    if (action === 'update_role' && !isAdminAssignableRole(requestedRole)) {
      return jsonResponse({ ok: false, error: 'Rôle profil invalide.' }, 400)
    }

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const callerProfile = await getCallerProfile(supabaseUser, supabaseAdmin)
    const targetProfile = await getTargetProfile(supabaseAdmin, profileId)

    if (callerProfile.id === targetProfile.id) {
      const selfActionMessage =
        action === 'delete'
          ? 'Vous ne pouvez pas supprimer votre propre profil.'
          : action === 'update_role'
            ? 'Vous ne pouvez pas modifier votre propre rôle.'
            : 'Vous ne pouvez pas modifier votre propre profil.'

      return jsonResponse(
        { ok: false, error: selfActionMessage },
      )
    }

    await assertNotLastActiveAdmin(supabaseAdmin, targetProfile, action, requestedRole)

    let warning: string | null = null

    if (action === 'deactivate') {
      await updateProfileStatus(supabaseAdmin, profileId, false)
    } else if (action === 'reactivate') {
      await updateProfileStatus(supabaseAdmin, profileId, true)
    } else if (action === 'update_role') {
      await updateProfileRole(supabaseAdmin, profileId, requestedRole as AdminAssignableRole)
    } else {
      const deleteResult = await deleteProfileAndAuthUser(supabaseAdmin, profileId)
      warning = deleteResult?.warning || null
    }

    await writeAuditLog(supabaseAdmin, {
      actor: callerProfile,
      target: targetProfile,
      action,
    })

    return jsonResponse({
      ok: true,
      action,
      profileId,
      profile_id: profileId,
      warning,
      ...(action === 'update_role' ? { role: requestedRole } : {}),
    })
  } catch (error) {
    console.error('[admin-delete-profile] action failed:', error)

    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Erreur admin inconnue.',
      },
    )
  }
})
