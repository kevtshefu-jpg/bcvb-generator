import { supabase } from '../../../lib/supabase'
import type { ProfileRow } from '../types/profile'

export async function fetchProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, category_id, is_active')
    .order('full_name', { ascending: true })

  if (error) throw error
  return (data ?? []) as ProfileRow[]
}

export async function fetchPlayerProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, category_id, is_active')
    .eq('role', 'joueur')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  if (error) throw error
  return (data ?? []) as ProfileRow[]
}

export async function fetchProfileById(profileId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, category_id, is_active')
    .eq('id', profileId)
    .single()

  if (error) throw error
  return data as ProfileRow
}