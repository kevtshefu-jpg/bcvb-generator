import { supabase } from '../../../lib/supabase'

export type RegistrationRequestRow = {
  id: string
  created_at: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  birth_year: number | null
  category_requested: string
  requested_category?: string | null
  role_requested: string
  requested_role?: string | null
  requested_team?: string | null
  notes: string | null
  status: 'pending' | 'approved' | 'rejected'
  approved_by?: string | null
  approved_at?: string | null
  rejected_by?: string | null
  rejected_at?: string | null
  activation_email_sent_at?: string | null
  activation_email_status?: string | null
  admin_note?: string | null
}

export type CreateRegistrationRequestInput = {
  first_name: string
  last_name: string
  email: string
  phone?: string
  birth_year?: number
  category_requested: string
  role_requested?: string
  notes?: string
}

export async function createRegistrationRequest(input: CreateRegistrationRequestInput) {
  const payload = {
    first_name: input.first_name,
    last_name: input.last_name,
    email: input.email,
    phone: input.phone || null,
    birth_year: input.birth_year ?? null,
    category_requested: input.category_requested,
    role_requested: input.role_requested || 'joueur',
    notes: input.notes || null,
  }

  const { data, error } = await supabase
    .from('registration_requests')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data as RegistrationRequestRow
}

export async function fetchRegistrationRequests() {
  const { data, error } = await supabase
    .from('registration_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as RegistrationRequestRow[]
}

export async function updateRegistrationRequestStatus(
  id: string,
  status: 'approved' | 'rejected',
  approvedBy?: string
) {
  const now = new Date().toISOString()
  const payload =
    status === 'approved'
      ? {
          status,
          approved_by: approvedBy ?? null,
          approved_at: now,
        }
      : {
          status,
          rejected_by: approvedBy ?? null,
          rejected_at: now,
        }

  const { data, error } = await supabase
    .from('registration_requests')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    const value = error.message.toLowerCase()
    const isMissingColumn =
      value.includes('could not find') ||
      value.includes('schema cache') ||
      (value.includes('column') && value.includes('does not exist'))

    if (!isMissingColumn) throw error

    const { data: fallbackData, error: fallbackError } = await supabase
      .from('registration_requests')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single()

    if (fallbackError) throw fallbackError
    return fallbackData as RegistrationRequestRow
  }

  return data as RegistrationRequestRow
}
