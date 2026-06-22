import { supabase } from '../../../lib/supabase'
import { createAdminActionNotification } from '../../admin/services/adminActionNotificationService'
import { createProfileRequest } from '../../admin/services/profileRequestService'

export type PublicRegistrationPayload = {
  firstName: string
  lastName: string
  email: string
  phone?: string
  birthYear: number
  categoryRequested: string
  roleRequested: string
  requestedTeam?: string
  notes?: string
}

export type PublicRegistrationResult = {
  ok: true
  registrationRequestId: string
  message: string
  warnings: string[]
}

type RegistrationInsertPayload = {
  first_name?: string
  last_name?: string
  email: string
  phone?: string | null
  birth_year?: number | null
  category_requested?: string
  role_requested?: string
  requested_team?: string | null
  notes?: string | null
  status: string
}

type InsertAttempt = {
  label: string
  payload: RegistrationInsertPayload
  minimalWarning?: string
}

export function serializeSupabaseError(error: unknown) {
  if (!error) return 'Erreur inconnue'

  if (error instanceof Error) {
    return error.message
  }

  try {
    return JSON.stringify(error, null, 2)
  } catch {
    return String(error)
  }
}

export function isMissingColumnError(error: unknown) {
  const value = serializeSupabaseError(error).toLowerCase()

  return (
    value.includes('could not find') ||
    value.includes('schema cache') ||
    (value.includes('column') && value.includes('does not exist')) ||
    (value.includes('column') && value.includes('not found'))
  )
}

export function isRelationMissingError(error: unknown) {
  const value = serializeSupabaseError(error).toLowerCase()

  return (
    value.includes('relation') && value.includes('does not exist') ||
    value.includes('table') && value.includes('does not exist') ||
    value.includes('could not find the table') ||
    value.includes('pgrst205')
  )
}

export function isRlsError(error: unknown) {
  const value = serializeSupabaseError(error).toLowerCase()

  return (
    value.includes('row-level security') ||
    value.includes('violates row-level security') ||
    value.includes('permission denied') ||
    value.includes('not authorized') ||
    value.includes('42501')
  )
}

export function getPublicRegistrationErrorMessage() {
  return 'Impossible d’envoyer la demande pour le moment. Merci de réessayer ou de contacter un responsable du BCVB.'
}

export const PUBLIC_REGISTRATION_SUCCESS_MESSAGE =
  'Votre demande a bien été envoyée. Un responsable du BCVB va l’étudier. Si elle est validée, vous recevrez un email sécurisé pour créer votre mot de passe.'

function normalizeText(value?: string) {
  return String(value || '').trim()
}

function normalizeEmail(value: string) {
  return normalizeText(value).toLowerCase()
}

function getFullName(payload: PublicRegistrationPayload) {
  return `${normalizeText(payload.firstName)} ${normalizeText(payload.lastName)}`.trim()
}

function buildInsertAttempts(payload: PublicRegistrationPayload): InsertAttempt[] {
  const fullPayload: RegistrationInsertPayload = {
    first_name: normalizeText(payload.firstName),
    last_name: normalizeText(payload.lastName),
    email: normalizeEmail(payload.email),
    phone: normalizeText(payload.phone) || null,
    birth_year: payload.birthYear,
    category_requested: normalizeText(payload.categoryRequested),
    role_requested: normalizeText(payload.roleRequested),
    requested_team: normalizeText(payload.requestedTeam) || null,
    notes: normalizeText(payload.notes) || null,
    status: 'pending',
  }

  return [
    {
      label: 'niveau 1 - payload complet',
      payload: fullPayload,
    },
    {
      label: 'niveau 2 - sans requested_team',
      payload: {
        first_name: fullPayload.first_name,
        last_name: fullPayload.last_name,
        email: fullPayload.email,
        phone: fullPayload.phone,
        birth_year: fullPayload.birth_year,
        category_requested: fullPayload.category_requested,
        role_requested: fullPayload.role_requested,
        notes: fullPayload.notes,
        status: fullPayload.status,
      },
      minimalWarning: 'La colonne requested_team semble absente de registration_requests.',
    },
    {
      label: 'niveau 3 - minimal club',
      payload: {
        first_name: fullPayload.first_name,
        last_name: fullPayload.last_name,
        email: fullPayload.email,
        category_requested: fullPayload.category_requested,
        role_requested: fullPayload.role_requested,
        notes: fullPayload.notes,
        status: fullPayload.status,
      },
      minimalWarning: 'Demande enregistrée sans téléphone, année de naissance ni équipe.',
    },
    {
      label: 'niveau 4 - ultra minimal',
      payload: {
        email: fullPayload.email,
        status: fullPayload.status,
      },
      minimalWarning:
        'Demande enregistrée en mode minimal : certaines colonnes manquent dans registration_requests.',
    },
  ]
}

async function insertWithSelect(attempt: InsertAttempt) {
  const { data, error } = await supabase
    .from('registration_requests')
    .insert(attempt.payload)
    .select('id')
    .single()

  if (!error) {
    return String(data?.id || 'unknown')
  }

  if (isRlsError(error)) {
    console.warn(
      `[publicRegistrationService] ${attempt.label} : insert avec select refusé, tentative sans select.`,
      error,
    )

    const { error: noSelectError } = await supabase
      .from('registration_requests')
      .insert(attempt.payload)

    if (!noSelectError) return 'unknown'
    throw noSelectError
  }

  throw error
}

export async function insertRegistrationRequestWithFallback(
  payload: PublicRegistrationPayload,
) {
  const warnings: string[] = []
  const errors: Array<{ level: string; error: unknown }> = []

  for (const attempt of buildInsertAttempts(payload)) {
    try {
      const registrationRequestId = await insertWithSelect(attempt)

      if (attempt.minimalWarning) warnings.push(attempt.minimalWarning)

      return {
        registrationRequestId,
        warnings,
      }
    } catch (error) {
      errors.push({ level: attempt.label, error })
      console.warn(`[publicRegistrationService] ${attempt.label} échoué :`, error)

      if (isRelationMissingError(error) || isRlsError(error)) {
        const diagnostic = errors
          .map((item) => `${item.level}: ${serializeSupabaseError(item.error)}`)
          .join('\n')
        throw new Error(`registration_requests indisponible.\n${diagnostic}`)
      }

      if (!isMissingColumnError(error)) {
        console.warn(
          `[publicRegistrationService] ${attempt.label} : erreur non liée à une colonne, tentative fallback suivante.`,
          error,
        )
      }
    }
  }

  const diagnostic = errors
    .map((item) => `${item.level}: ${serializeSupabaseError(item.error)}`)
    .join('\n')

  throw new Error(`Aucun niveau d’insertion registration_requests n’a réussi.\n${diagnostic}`)
}

export async function tryCreateProfileRequest(
  payload: PublicRegistrationPayload,
  _registrationRequestId: string,
) {
  const email = normalizeEmail(payload.email)
  const fullName = getFullName(payload) || email
  const requestedRole = normalizeText(payload.roleRequested) || 'member'
  const requestedTeam = normalizeText(payload.requestedTeam) || null

  try {
    await createProfileRequest({
      userId: null,
      email,
      fullName,
      requestedRole,
      requestedCategoryId: normalizeText(payload.categoryRequested) || null,
      requestedTeam,
      phone: normalizeText(payload.phone) || null,
      motivation: normalizeText(payload.notes) || null,
      message: normalizeText(payload.notes) || null,
    })
    return null
  } catch (error) {
    console.warn('[publicRegistrationService] profile_requests complet ignoré :', error)
  }

  try {
    const { error } = await supabase
      .from('profile_requests')
      .insert({
        email,
        full_name: fullName,
        requested_role: requestedRole,
        requested_team: requestedTeam,
        status: 'pending',
      })

    if (error) throw error
    return 'profile_requests créé avec un payload minimal.'
  } catch (error) {
    console.warn('[publicRegistrationService] profile_requests minimal ignoré :', error)
    return `profile_requests ignoré : ${serializeSupabaseError(error)}`
  }
}

async function insertAdminNotificationDirect(
  payload: PublicRegistrationPayload,
  registrationRequestId: string,
) {
  const email = normalizeEmail(payload.email)
  const fullName = getFullName(payload) || email
  const roleRequested = normalizeText(payload.roleRequested) || 'member'
  const basePayload = {
    type: 'registration_request_created',
    title: 'Nouvelle demande d’inscription',
    message: `${fullName} souhaite créer un accès ${roleRequested}.`,
    action_url: '/admin/inscriptions',
  }

  const { error } = await supabase
    .from('admin_notifications')
    .insert({
      ...basePayload,
      recipient_role: 'admin',
      metadata: {
        registration_request_id: registrationRequestId,
        email,
        first_name: normalizeText(payload.firstName),
        last_name: normalizeText(payload.lastName),
        role_requested: roleRequested,
        category_requested: normalizeText(payload.categoryRequested),
        requested_team: normalizeText(payload.requestedTeam) || null,
      },
    })

  if (!error) return null

  if (!isMissingColumnError(error)) {
    throw error
  }

  console.warn(
    '[publicRegistrationService] admin_notifications sans metadata/recipient_role.',
    error,
  )

  const { error: fallbackError } = await supabase
    .from('admin_notifications')
    .insert(basePayload)

  if (fallbackError) throw fallbackError

  return 'admin_notifications créé sans metadata ni recipient_role.'
}

export async function tryNotifyAdmin(
  payload: PublicRegistrationPayload,
  registrationRequestId: string,
) {
  const warnings: string[] = []
  const email = normalizeEmail(payload.email)
  const fullName = getFullName(payload) || email

  const { error: functionError } = await supabase.functions.invoke('notify-profile-request', {
    body: {
      diagnostic: false,
      fullName,
      email,
      requestedRole: normalizeText(payload.roleRequested) || 'member',
      requestedCategoryId: normalizeText(payload.categoryRequested),
      requestedTeam: normalizeText(payload.requestedTeam) || null,
      phone: normalizeText(payload.phone) || null,
      message: normalizeText(payload.notes) || null,
      registrationRequestId,
    },
  })

  if (!functionError) return warnings

  console.warn('[publicRegistrationService] notify-profile-request ignorée :', functionError)
  warnings.push(`notify-profile-request ignorée : ${serializeSupabaseError(functionError)}`)

  const notificationResult = await createAdminActionNotification({
    eventType: 'registration_request_created',
    title: 'Nouvelle demande d’inscription',
    message: `${fullName} souhaite créer un accès ${normalizeText(payload.roleRequested) || 'member'}.`,
    actionUrl: '/admin/inscriptions',
    metadata: {
      registration_request_id: registrationRequestId,
      email,
      first_name: normalizeText(payload.firstName),
      last_name: normalizeText(payload.lastName),
      role_requested: normalizeText(payload.roleRequested) || 'member',
      category_requested: normalizeText(payload.categoryRequested),
      requested_team: normalizeText(payload.requestedTeam) || null,
    },
  })

  if (notificationResult.ok) return warnings

  try {
    const directWarning = await insertAdminNotificationDirect(payload, registrationRequestId)
    if (directWarning) warnings.push(directWarning)
  } catch (error) {
    console.warn('[publicRegistrationService] admin_notifications ignoré :', error)
    warnings.push(`admin_notifications ignoré : ${serializeSupabaseError(error)}`)
  }

  return warnings
}

export async function submitPublicRegistration(
  payload: PublicRegistrationPayload,
): Promise<PublicRegistrationResult> {
  let registrationRequestId = 'unknown'
  const warnings: string[] = []

  try {
    const result = await insertRegistrationRequestWithFallback(payload)
    registrationRequestId = result.registrationRequestId || 'unknown'
    warnings.push(...result.warnings)
  } catch (error) {
    console.error('[publicRegistrationService] registration_requests bloquant :', error)
    throw new Error(getPublicRegistrationErrorMessage())
  }

  const profileWarning = await tryCreateProfileRequest(payload, registrationRequestId)
  if (profileWarning) warnings.push(profileWarning)

  const notificationWarnings = await tryNotifyAdmin(payload, registrationRequestId)
  warnings.push(...notificationWarnings)

  return {
    ok: true,
    registrationRequestId,
    message: PUBLIC_REGISTRATION_SUCCESS_MESSAGE,
    warnings,
  }
}
