import { supabase } from '../../../lib/supabase'

export type ProfileRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'needs_info'
  | 'cancelled'

export type ProfileRequestRow = {
  id: string
  user_id: string | null
  email: string
  full_name: string
  requested_role: string
  requested_category_id: string | null
  requested_team: string | null
  phone: string | null
  motivation: string | null
  message: string | null
  status: ProfileRequestStatus
  admin_note: string | null
  decided_by: string | null
  decided_at: string | null
  created_at: string
  updated_at: string
}

export type CreateProfileRequestPayload = {
  userId?: string | null
  email: string
  fullName: string
  requestedRole: string
  requestedCategoryId?: string | null
  requestedTeam?: string | null
  phone?: string | null
  motivation?: string | null
  message?: string | null
}

export type ApproveProfileRequestPayload = {
  requestId: string
  finalRole: string
  finalCategoryId?: string | null
  adminNote?: string | null
}

export async function createProfileRequest(payload: CreateProfileRequestPayload) {
  const { data, error } = await supabase
    .from('profile_requests')
    .insert({
      user_id: payload.userId || null,
      email: payload.email.trim().toLowerCase(),
      full_name: payload.fullName.trim(),
      requested_role: payload.requestedRole,
      requested_category_id: payload.requestedCategoryId || null,
      requested_team: payload.requestedTeam || null,
      phone: payload.phone || null,
      motivation: payload.motivation || null,
      message: payload.message || null,
      status: 'pending',
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as ProfileRequestRow
}

export async function fetchProfileRequests(status?: ProfileRequestStatus | 'all') {
  let query = supabase
    .from('profile_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as ProfileRequestRow[]
}

export async function approveProfileRequest(payload: ApproveProfileRequestPayload) {
  const { data, error } = await supabase
    .rpc('approve_profile_request', {
      request_id: payload.requestId,
      final_role: payload.finalRole,
      final_category_id: payload.finalCategoryId || null,
      admin_note_value: payload.adminNote || null,
    })
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as ProfileRequestRow
}

export async function rejectProfileRequest(requestId: string, adminNote?: string | null) {
  const { data, error } = await supabase
    .rpc('reject_profile_request', {
      request_id: requestId,
      admin_note_value: adminNote || null,
    })
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as ProfileRequestRow
}

export async function updateProfileRequestDraft(
  requestId: string,
  patch: Partial<
    Pick<
      ProfileRequestRow,
      | 'requested_role'
      | 'requested_category_id'
      | 'requested_team'
      | 'phone'
      | 'admin_note'
      | 'status'
    >
  >,
) {
  const { data, error } = await supabase
    .from('profile_requests')
    .update(patch)
    .eq('id', requestId)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as ProfileRequestRow
}