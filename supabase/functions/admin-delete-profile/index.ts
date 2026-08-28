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

type ApiErrorCode =
  | 'AUTH_REQUIRED'
  | 'INVALID_JWT'
  | 'PROFILE_FORBIDDEN'
  | 'ROLE_FORBIDDEN'
  | 'INVALID_PAYLOAD'
  | 'PROFILE_NOT_FOUND'
  | 'SELF_ACTION_FORBIDDEN'
  | 'LAST_ADMIN_CONFLICT'
  | 'DEPENDENCY_CONFLICT'
  | 'INTERNAL_ERROR'

class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: string,
    readonly hint?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
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

function errorResponse(error: ApiError) {
  return jsonResponse({
    ok: false,
    code: error.code,
    error: error.message,
    message: error.message,
    ...(error.details ? { details: error.details } : {}),
    ...(error.hint ? { hint: error.hint } : {}),
  }, error.status)
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

function getBearerToken(request: Request) {
  return normalizeText(request.headers.get('Authorization')).replace(/^Bearer\s+/i, '')
}

async function getCallerProfile(
  supabaseAdmin: ReturnType<typeof createClient>,
  token: string,
) {
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)

  if (userError || !userData.user) {
    throw new ApiError(401, 'INVALID_JWT', 'Session invalide ou expirée.')
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, role, is_active, profile_status')
    .eq('id', userData.user.id)
    .maybeSingle()

  if (profileError) {
    throw new ApiError(500, 'INTERNAL_ERROR', 'Impossible de vérifier les autorisations.')
  }

  if (!profile || !profile.is_active || profile.profile_status !== 'active') {
    throw new ApiError(403, 'PROFILE_FORBIDDEN', 'Profil absent ou inactif.')
  }

  if (!isStrictAdminRole(profile.role)) {
    throw new ApiError(403, 'ROLE_FORBIDDEN', 'Accès administrateur requis.')
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
    throw new ApiError(500, 'INTERNAL_ERROR', 'Impossible de vérifier le profil cible.')
  }

  if (!data) {
    throw new ApiError(404, 'PROFILE_NOT_FOUND', 'Profil cible introuvable.')
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
    throw new ApiError(500, 'INTERNAL_ERROR', 'Impossible de vérifier les administrateurs actifs.')
  }

  if ((count || 0) <= 1) {
    throw new ApiError(
      409,
      'LAST_ADMIN_CONFLICT',
      action === 'delete'
        ? 'Le dernier administrateur actif ne peut pas être supprimé.'
        : 'Le dernier administrateur actif ne peut pas être modifié.',
    )
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
  supabaseUser: ReturnType<typeof createClient>,
  supabaseAdmin: ReturnType<typeof createClient>,
  actorProfileId: string,
  targetProfileId: string,
) {
  const { data, error } = await supabaseUser.rpc('delete_profile_atomically', {
    actor_profile_id: actorProfileId,
    target_profile_id: targetProfileId,
  })

  if (error) {
    if (error.code === 'PT403') {
      throw new ApiError(403, 'SELF_ACTION_FORBIDDEN', error.message)
    }
    if (error.code === 'PT404') {
      throw new ApiError(404, 'PROFILE_NOT_FOUND', error.message)
    }
    if (error.code === 'PT409') {
      const lastAdmin = error.message.toLowerCase().includes('dernier administrateur')
      throw new ApiError(
        409,
        lastAdmin ? 'LAST_ADMIN_CONFLICT' : 'DEPENDENCY_CONFLICT',
        error.message,
        error.details || undefined,
        error.hint || undefined,
      )
    }
    throw new ApiError(500, 'INTERNAL_ERROR', 'La suppression définitive a échoué.')
  }

  const result = data as { deleted?: boolean; audit_recorded?: boolean } | null
  if (!result?.deleted || !result.audit_recorded) {
    throw new ApiError(500, 'INTERNAL_ERROR', 'La suppression définitive n’a pas été confirmée.')
  }

  const [{ data: remainingProfile, error: profileCheckError }, authCheck] = await Promise.all([
    supabaseAdmin.from('profiles').select('id').eq('id', targetProfileId).maybeSingle(),
    supabaseAdmin.auth.admin.getUserById(targetProfileId),
  ])

  const authError = authCheck.error as ({ status?: number; code?: string; message?: string } | null)
  const authUserIsAbsent = Boolean(
    authError && (
      authError.status === 404 ||
      authError.code === 'user_not_found' ||
      authError.message?.trim().toLowerCase() === 'user not found'
    ),
  )

  if (
    profileCheckError ||
    remainingProfile ||
    (authError && !authUserIsAbsent) ||
    authCheck.data?.user
  ) {
    throw new ApiError(500, 'INTERNAL_ERROR', 'La suppression définitive n’a pas été confirmée.')
  }

  return { warning: null }
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
      return errorResponse(new ApiError(500, 'INTERNAL_ERROR', 'Une erreur interne est survenue.'))
    }

    const token = getBearerToken(request)
    if (!token) {
      return errorResponse(new ApiError(401, 'AUTH_REQUIRED', 'Authentification requise.'))
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const callerProfile = await getCallerProfile(supabaseAdmin, token)

    let payload: ActionPayload
    try {
      payload = (await request.json()) as ActionPayload
    } catch {
      throw new ApiError(400, 'INVALID_PAYLOAD', 'Corps de requête invalide.')
    }

    const profileId = normalizeText(payload.profileId)
    const action = payload.action

    if (!profileId) {
      throw new ApiError(400, 'INVALID_PAYLOAD', 'Identifiant de profil manquant.')
    }

    if (!action || !['deactivate', 'reactivate', 'delete', 'update_role'].includes(action)) {
      throw new ApiError(400, 'INVALID_PAYLOAD', 'Action profil invalide.')
    }

    const requestedRole = action === 'update_role' ? payload.role : undefined
    if (action === 'update_role' && !isAdminAssignableRole(requestedRole)) {
      throw new ApiError(400, 'INVALID_PAYLOAD', 'Rôle profil invalide.')
    }

    const targetProfile = await getTargetProfile(supabaseAdmin, profileId)

    if (callerProfile.id === targetProfile.id) {
      const selfActionMessage =
        action === 'delete'
          ? 'Vous ne pouvez pas supprimer votre propre profil.'
          : action === 'update_role'
            ? 'Vous ne pouvez pas modifier votre propre rôle.'
            : 'Vous ne pouvez pas modifier votre propre profil.'

      throw new ApiError(403, 'SELF_ACTION_FORBIDDEN', selfActionMessage)
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
      const deleteResult = await deleteProfileAndAuthUser(
        supabaseUser,
        supabaseAdmin,
        callerProfile.id,
        profileId,
      )
      warning = deleteResult?.warning || null
    }

    if (action !== 'delete') {
      await writeAuditLog(supabaseAdmin, {
        actor: callerProfile,
        target: targetProfile,
        action,
      })
    }

    return jsonResponse({
      ok: true,
      action,
      profileId,
      profile_id: profileId,
      warning,
      ...(action === 'update_role' ? { role: requestedRole } : {}),
    })
  } catch (error) {
    if (error instanceof ApiError) return errorResponse(error)

    console.error('[admin-delete-profile] unexpected failure')
    return errorResponse(new ApiError(500, 'INTERNAL_ERROR', 'Une erreur interne est survenue.'))
  }
})
