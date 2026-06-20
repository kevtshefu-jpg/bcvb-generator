import { supabase } from '../../../lib/supabase'

export type CreateApprovedUserResult = {
  ok: boolean
  userId?: string
  email?: string
  fullName?: string
  role?: string
  userAlreadyExisted?: boolean
  passwordResetLink?: string | null
  temporary_password?: string | null
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

  return data
}

export async function approveRegistrationRequest(requestId: string, finalRole?: string) {
  return createApprovedUser(requestId, finalRole)
}

export async function approveRegistrationAndCreateUser(requestId: string, finalRole?: string) {
  const result = await createApprovedUser(requestId, finalRole)

  return {
    ...result,
    temporary_password: result.passwordResetLink || result.temporary_password || null,
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
    approved_by: approvedBy || null,
    approved_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('registration_requests')
    .update(fullPatch)
    .eq('id', requestId)

  if (!error) return

  if (!isMissingColumnError(error.message)) {
    throw new Error(error.message)
  }

  const { error: fallbackError } = await supabase
    .from('registration_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId)

  if (fallbackError) throw new Error(fallbackError.message)
}
