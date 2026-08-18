import { supabase } from '../../lib/supabase'
import type { TechnicalDashboardRole, TechnicalDashboardSource } from './types'

function countOrThrow(result: { count: number | null; error: { message: string } | null }, label: string) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`)
  return result.count || 0
}

export async function fetchTechnicalDashboard(role: TechnicalDashboardRole): Promise<TechnicalDashboardSource> {
  const canReadTechnicalDetails = role === 'admin' || role === 'responsable_technique'
  const [teamsResult, staffResult, peopleResult, registrationsResult, profilesResult, slotsResult] = await Promise.all([
    supabase.from('teams').select('id, name, category, level, season, head_coach_id, assistant_coach_ids').is('archived_at', null).order('category').order('name'),
    canReadTechnicalDetails
      ? supabase.from('team_staff_assignments').select('team_id, profile_id, assignment_role, is_active').eq('is_active', true)
      : Promise.resolve({ data: null, error: null }),
    canReadTechnicalDetails
      ? supabase.from('profiles').select('id, full_name, email, role').eq('is_active', true).eq('profile_status', 'active')
      : Promise.resolve({ data: null, error: null }),
    canReadTechnicalDetails
      ? supabase.from('registration_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending')
      : Promise.resolve({ count: null, error: null }),
    canReadTechnicalDetails
      ? supabase.from('profile_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending')
      : Promise.resolve({ count: null, error: null }),
    supabase.from('training_slots').select('id,team_id,weekday,start_time,end_time,location_name,valid_from,valid_until,is_active').eq('is_active',true).order('weekday').order('start_time'),
  ])

  if (teamsResult.error) throw new Error(`Équipes: ${teamsResult.error.message}`)
  if (staffResult.error) throw new Error(`Encadrement: ${staffResult.error.message}`)
  if (peopleResult.error) throw new Error(`Profils d’encadrement: ${peopleResult.error.message}`)
  if (slotsResult.error) throw new Error(`Planning opérationnel: ${slotsResult.error.message}`)

  return {
    teams: teamsResult.data || [],
    staffAssignments: staffResult.data,
    profiles: peopleResult.data,
    pendingRegistrations: canReadTechnicalDetails ? countOrThrow(registrationsResult, 'Inscriptions') : null,
    pendingProfileRequests: canReadTechnicalDetails ? countOrThrow(profilesResult, 'Demandes de profil') : null,
    unreadAdminNotifications: null,
    trainingSlots: slotsResult.data || [],
  }
}
