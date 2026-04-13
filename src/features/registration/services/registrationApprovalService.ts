import { supabase } from '../../../lib/supabase'

export async function approveRegistrationAndCreateUser(requestId: string) {
  const { data, error } = await supabase.functions.invoke('create-approved-user', {
    body: {
      requestId,
    },
  })

  if (error) throw error

  return data as {
    success: boolean
    user_id: string
    email: string
    temporary_password: string
  }
}

export async function rejectRegistrationRequest(requestId: string, approvedBy?: string) {
  const { data, error } = await supabase
    .from('registration_requests')
    .update({
      status: 'rejected',
      approved_by: approvedBy ?? null,
      approved_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select('*')
    .single()

  if (error) throw error
  return data
}