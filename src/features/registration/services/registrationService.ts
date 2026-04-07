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
  role_requested: string
  notes: string | null
  status: 'pending' | 'approved' | 'rejected'
  approved_by: string | null
  approved_at: string | null
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
  const payload = {
    status,
    approved_by: approvedBy ?? null,
    approved_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('registration_requests')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as RegistrationRequestRow
}