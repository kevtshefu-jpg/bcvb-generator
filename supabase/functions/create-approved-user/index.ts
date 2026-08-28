import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { isAdminAssignableRole, isSensitiveAdminRole } from '../_shared/adminProfileRoles.ts'

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
  activation_email_status?: string | null
  created_at?: string | null
}

type CreateApprovedUserPayload = {
  requestId?: string
  id?: string
  finalRole?: string
  role?: string
  retryActivation?: boolean
}

type EmailContact = {
  name: string
  email: string
}

type ApiErrorCode =
  | 'AUTH_REQUIRED'
  | 'INVALID_JWT'
  | 'PROFILE_FORBIDDEN'
  | 'ROLE_FORBIDDEN'
  | 'INVALID_PAYLOAD'
  | 'REQUEST_NOT_FOUND'
  | 'REQUEST_ALREADY_PROCESSED'
  | 'INTERNAL_ERROR'

class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: string,
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
  }, error.status)
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
  const raw = normalizeText(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  if (!raw) return 'member'
  const normalized = raw.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  const aliases: Record<string, string> = {
    membre: 'member',
    technical_manager: 'responsable_technique',
    parent_referent: 'parent_referent',
  }
  return aliases[normalized] || normalized
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[character] || character)
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
  const perPage = 1000
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })
    if (error) throw new Error(`Recherche utilisateur Auth impossible : ${error.message}`)
    const match = data.users.find((user) => normalizeEmail(user.email) === email)
    if (match) return match
    if (data.users.length < perPage) return null
  }
}

async function assertAdminCaller(
  supabaseAdmin: ReturnType<typeof createClient>,
  authorization: string | null,
) {
  const token = authorization?.replace('Bearer ', '').trim()

  if (!token) {
    throw new ApiError(401, 'AUTH_REQUIRED', 'Authentification requise.')
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)

  if (userError || !userData.user) {
    throw new ApiError(401, 'INVALID_JWT', 'Session invalide ou expirée.')
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, role, is_active, profile_status')
    .eq('id', userData.user.id)
    .maybeSingle()

  if (profileError) {
    throw new ApiError(500, 'INTERNAL_ERROR', 'Impossible de vérifier les autorisations.')
  }

  const role = normalizeRole(profile?.role)

  if (!profile || !profile.is_active || profile.profile_status !== 'active') {
    throw new ApiError(403, 'PROFILE_FORBIDDEN', 'Profil absent ou inactif.')
  }

  if (role !== 'admin' && role !== 'responsable_technique') {
    throw new ApiError(403, 'ROLE_FORBIDDEN', 'Accès administrateur requis.')
  }

  return { user: userData.user, role }
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

  const { data: updatedRow, error } = await supabaseAdmin
    .from('registration_requests')
    .update(fullPatch)
    .eq('id', requestId)
    .eq('status', 'processing')
    .select('id')
    .maybeSingle()

  if (!error && updatedRow) return
  if (!error) throw new Error('Compte créé, mais la réservation de la demande a été perdue.')

  if (isMissingColumnError(error.message)) {
    const { data: fallbackRow, error: fallbackError } = await supabaseAdmin
      .from('registration_requests')
      .update({ status: 'approved' })
      .eq('id', requestId)
      .eq('status', 'processing')
      .select('id')
      .maybeSingle()

    if (fallbackError || !fallbackRow) {
      throw new Error(`Compte créé, mais demande non mise à jour : ${fallbackError?.message || 'réservation perdue'}`)
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

  const safeFullName = escapeHtml(fullName)
  const safeActivationLink = escapeHtml(activationLink)
  const htmlContent = `
    <p>Bonjour ${safeFullName},</p>
    <p>Votre accès au référentiel BCVB a été validé.</p>
    <p>Vous pouvez créer votre mot de passe avec ce lien sécurisé :</p>
    <p><a href="${safeActivationLink}">Créer mon mot de passe</a></p>
    <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>${safeActivationLink}</p>
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
      return errorResponse(new ApiError(
        500,
        'INTERNAL_ERROR',
        'Une erreur interne est survenue.',
      ))
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

    let payload: CreateApprovedUserPayload
    try {
      payload = (await request.json()) as CreateApprovedUserPayload
    } catch {
      throw new ApiError(400, 'INVALID_PAYLOAD', 'Corps de requête invalide.')
    }
    const requestId = normalizeText(payload.requestId || payload.id)

    if (!requestId) {
      return errorResponse(new ApiError(
        400,
        'INVALID_PAYLOAD',
        'Identifiant de demande manquant.',
      ))
    }

    const { data: requestRow, error: requestError } = await supabaseAdmin
      .from('registration_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle()

    if (requestError || !requestRow) {
      return errorResponse(new ApiError(
        404,
        'REQUEST_NOT_FOUND',
        'Demande introuvable.',
      ))
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

    if (!isAdminAssignableRole(finalRole)) {
      return errorResponse(new ApiError(400, 'INVALID_PAYLOAD', 'Rôle final invalide.'))
    }

    if (isSensitiveAdminRole(finalRole) && adminUser.role !== 'admin') {
      return jsonResponse(
        { ok: false, error: 'Seul un administrateur peut attribuer un rôle élevé.' },
        403,
      )
    }

    if (!email) {
      return jsonResponse({ ok: false, error: 'Email manquant dans la demande.' }, 400)
    }

    const isEmailRetry = payload.retryActivation === true
    const { data: claimedRequest, error: claimError } = await supabaseAdmin
      .rpc('claim_registration_request_approval', {
        request_id: requestId,
        approved_by_value: adminUser.user.id,
        retry_activation: isEmailRetry,
      })
      .single()

    if (claimError?.code === 'PT404') {
      return errorResponse(new ApiError(404, 'REQUEST_NOT_FOUND', 'Demande introuvable.'))
    }
    if (claimError?.code === 'PT409') {
      return errorResponse(new ApiError(409, 'REQUEST_ALREADY_PROCESSED', 'Demande déjà traitée ou en cours.'))
    }
    if (claimError || !claimedRequest) {
      throw new Error(`Réservation de la demande impossible : ${claimError?.message || 'réponse absente'}`)
    }

    try {

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
        throw new Error(`Création du compte Auth impossible : ${createUserError.message}`)
      }

      userId = createdUserData.user?.id || null
    }

    if (!userId) {
      throw new Error("Impossible de récupérer l'identifiant utilisateur.")
    }

    const { data: existingProfile, error: existingProfileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, is_active')
      .eq('id', userId)
      .maybeSingle()

    if (existingProfileError) {
      throw new Error(`Impossible de vérifier le profil existant : ${existingProfileError.message}`)
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
      adminUser.user.id,
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
    } catch (processingError) {
      const rollbackPatch = isEmailRetry
        ? { status: 'approved', activation_email_status: 'failed' }
        : { status: 'pending', approved_by: null }
      const { error: rollbackError } = await supabaseAdmin
        .from('registration_requests')
        .update(rollbackPatch)
        .eq('id', requestId)
        .eq('status', 'processing')
      if (rollbackError) console.error('[create-approved-user] claim rollback failed')
      throw processingError
    }
  } catch (error) {
    if (error instanceof ApiError) return errorResponse(error)

    console.error('[create-approved-user] unexpected failure')
    return errorResponse(new ApiError(
      500,
      'INTERNAL_ERROR',
      'Une erreur interne est survenue.',
    ))
  }
})
