import { supabase } from '../../../lib/supabase'

type ApproveRegistrationInput = {
  request_id: string
  email: string
  first_name: string
  last_name: string
  category_requested: string
  role_requested: string
  approved_by?: string
}

export async function approveRegistrationAndCreateUser(input: ApproveRegistrationInput) {
  const { data, error } = await supabase.functions.invoke('create-approved-user', {
    body: input,
  })

  if (error) throw error

  return data as {
    success: boolean
    user_id: string
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