import { supabase } from '../../../lib/supabase'

export type CreateApprovedUserResult = {
  ok: boolean
  userId?: string
  user_id?: string
  email?: string
  fullName?: string
  full_name?: string
  role?: string
  userAlreadyExisted?: boolean
  user_already_existed?: boolean
  email_sent?: boolean
  activation_email_status?: string | null
  message?: string
  error?: string
}

function getReadableFunctionError(error: unknown) {
  if (!error) return 'Erreur inconnue.'

  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

async function notifyRegistrationDecision(eventType: string, requestId: string) {
  try {
    const title =
      eventType === 'registration_approved'
        ? 'Inscription validée'
        : 'Inscription refusée'

    const message =
      eventType === 'registration_approved'
        ? 'Une demande d’inscription BCVB vient d’être validée.'
        : 'Une demande d’inscription BCVB vient d’être refusée.'

    const { error } = await supabase.functions.invoke('notify-admin-event', {
      body: {
        eventType,
        title,
        message,
        actionUrl: '/admin/inscriptions',
        metadata: {
          registration_request_id: requestId,
        },
      },
    })

    if (error) {
      console.warn('Notification email décision inscription ignorée :', error)
    }
  } catch (error) {
    console.warn('Notification email décision inscription ignorée :', error)
  }
}

export async function createApprovedUser(requestId: string, finalRole?: string) {
  const { data, error } = await supabase.functions.invoke<CreateApprovedUserResult>(
    'create-approved-user',
    {
      body: {
        requestId,
        finalRole,
      },
    },
  )

  if (error) {
    throw new Error(
      `La fonction de création du compte a échoué. Détail : ${getReadableFunctionError(error)}`,
    )
  }

  if (!data?.ok) {
    throw new Error(data?.error || 'La création du compte a échoué.')
  }

  await notifyRegistrationDecision('registration_approved', requestId)

  return data
}

export async function approveRegistrationRequest(requestId: string, finalRole?: string) {
  return createApprovedUser(requestId, finalRole)
}

export async function approveRegistrationAndCreateUser(requestId: string, finalRole?: string) {
  const result = await createApprovedUser(requestId, finalRole)

  return {
    ...result,
    message:
      result.message ||
      (result.email_sent
        ? 'Compte créé et email d’activation envoyé.'
        : 'Compte créé, mais l’email d’activation doit être renvoyé.'),
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

export async function rejectRegistrationRequest(requestId: string, approvedBy?: string) {
  const fullPatch = {
    status: 'rejected',
    rejected_by: approvedBy || null,
    rejected_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('registration_requests')
    .update(fullPatch)
    .eq('id', requestId)

  if (!error) {
    await notifyRegistrationDecision('registration_rejected', requestId)
    return
  }

  if (!isMissingColumnError(error.message)) {
    throw new Error(error.message)
  }

  const { error: fallbackError } = await supabase
    .from('registration_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId)

  if (fallbackError) throw new Error(fallbackError.message)

  await notifyRegistrationDecision('registration_rejected', requestId)
}
