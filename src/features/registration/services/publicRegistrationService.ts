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
  ok: boolean
  registrationRequestId?: string
  warning?: string
}

type RegistrationInsertPayload = {
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  birth_year?: number | null
  category_requested: string
  role_requested: string
  requested_team?: string | null
  notes: string | null
  status: 'pending'
}

export function isMissingColumnError(message: string) {
  const value = message.toLowerCase()

  return (
    value.includes('could not find') ||
    value.includes('schema cache') ||
    (value.includes('column') && value.includes('does not exist'))
  )
}

export function getPublicRegistrationErrorMessage(_error: unknown) {
  return 'Impossible d’envoyer la demande pour le moment. Merci de réessayer ou de contacter un responsable du BCVB.'
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function buildRegistrationPayload(payload: PublicRegistrationPayload): RegistrationInsertPayload {
  return {
    first_name: payload.firstName.trim(),
    last_name: payload.lastName.trim(),
    email: normalizeEmail(payload.email),
    phone: payload.phone?.trim() || null,
    birth_year: payload.birthYear,
    category_requested: payload.categoryRequested.trim(),
    role_requested: payload.roleRequested.trim(),
    requested_team: payload.requestedTeam?.trim() || null,
    notes: payload.notes?.trim() || null,
    status: 'pending',
  }
}

function withoutRequestedTeam(payload: RegistrationInsertPayload) {
  const { requested_team: _requestedTeam, ...fallback } = payload
  return fallback
}

function minimalPayload(payload: RegistrationInsertPayload) {
  return {
    first_name: payload.first_name,
    last_name: payload.last_name,
    email: payload.email,
    category_requested: payload.category_requested,
    role_requested: payload.role_requested,
    notes: payload.notes,
    status: payload.status,
  }
}

async function insertRegistrationPayload(payload: Partial<RegistrationInsertPayload>) {
  const { data, error } = await supabase
    .from('registration_requests')
    .insert(payload)
    .select('id')
    .single()

  if (error) {
    throw error
  }

  return String(data?.id || '')
}

export async function insertRegistrationRequestWithFallback(
  payload: PublicRegistrationPayload,
) {
  const fullPayload = buildRegistrationPayload(payload)

  try {
    return await insertRegistrationPayload(fullPayload)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (!isMissingColumnError(message)) {
      throw error
    }

    console.warn(
      'registration_requests : colonne optionnelle absente, fallback sans requested_team.',
      error,
    )
  }

  try {
    // TODO: ajouter requested_team à registration_requests côté Supabase si l’historique d’inscription doit conserver cette information.
    return await insertRegistrationPayload(withoutRequestedTeam(fullPayload))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (!isMissingColumnError(message)) {
      throw error
    }

    console.warn(
      'registration_requests : fallback sans phone/birth_year après erreur de schéma.',
      error,
    )
  }

  return insertRegistrationPayload(minimalPayload(fullPayload))
}

async function tryCreateProfileRequest(payload: PublicRegistrationPayload) {
  try {
    await createProfileRequest({
      userId: null,
      email: normalizeEmail(payload.email),
      fullName: `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim(),
      requestedRole: payload.roleRequested.trim(),
      requestedCategoryId: payload.categoryRequested.trim(),
      requestedTeam: payload.requestedTeam?.trim() || null,
      phone: payload.phone?.trim() || null,
      motivation: payload.notes?.trim() || null,
      message: payload.notes?.trim() || null,
    })
  } catch (error) {
    console.warn('profile_requests non bloquant après inscription publique :', error)
  }
}

export async function notifyAdminRegistrationCreated(
  payload: PublicRegistrationPayload,
  registrationRequestId?: string,
) {
  await createAdminActionNotification({
    eventType: 'registration_request_created',
    title: 'Nouvelle demande d’inscription',
    message: `${payload.firstName.trim()} ${payload.lastName.trim()} souhaite créer un profil ${payload.roleRequested.trim()}.`,
    actionUrl: '/admin/inscriptions',
    metadata: {
      registration_request_id: registrationRequestId || null,
      email: normalizeEmail(payload.email),
      role_requested: payload.roleRequested.trim(),
      category_requested: payload.categoryRequested.trim(),
      requested_team: payload.requestedTeam?.trim() || null,
    },
  })
}

export async function submitPublicRegistration(
  payload: PublicRegistrationPayload,
): Promise<PublicRegistrationResult> {
  let registrationRequestId = ''

  try {
    registrationRequestId = await insertRegistrationRequestWithFallback(payload)
  } catch (error) {
    console.error('registration_requests bloquant pour inscription publique :', error)
    return {
      ok: false,
      warning: getPublicRegistrationErrorMessage(error),
    }
  }

  await tryCreateProfileRequest(payload)

  try {
    await notifyAdminRegistrationCreated(payload, registrationRequestId)
  } catch (error) {
    console.warn('Notification inscription publique ignorée :', error)
  }

  return {
    ok: true,
    registrationRequestId,
  }
}
