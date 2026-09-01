import { supabase } from '../../lib/supabase'

export type StaffAssignmentRole = 'head_coach' | 'assistant_coach' | 'team_staff' | 'parent_referent'

export type TeamRow = {
  id: string
  name: string
  category: string
  level: string
  season: string
  archived_at: string | null
}

export type StaffProfile = {
  id: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  profile_status: string
}

export type StaffAssignment = {
  id: string
  team_id: string
  profile_id: string
  assignment_role: StaffAssignmentRole
  is_active: boolean
  profile: StaffProfile | null
}

export type TeamPlayer = {
  id: string
  first_name: string
  last_name: string
  category: string | null
  membership_status: string
}

export type TeamDetail = TeamRow & {
  staff: StaffAssignment[]
  players: TeamPlayer[]
}

export function canManageTeamStaff(role?: string | null) {
  return role === 'admin' || role === 'responsable_technique'
}

export function assertAssignableProfile(profile: Pick<StaffProfile, 'is_active' | 'profile_status'> | null | undefined) {
  if (!profile || !profile.is_active || profile.profile_status !== 'active') {
    throw new Error('Ce profil est inactif, supprimé ou indisponible et ne peut pas être affecté.')
  }
}

export function hasActiveDuplicate(assignments: StaffAssignment[], profileId: string, role: StaffAssignmentRole) {
  return assignments.some((item) => item.profile_id === profileId && item.assignment_role === role && item.is_active)
}

export async function loadTeams(): Promise<TeamRow[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('id, name, category, level, season, archived_at')
    .is('archived_at', null)
    .order('category')
    .order('name')
  if (error) throw new Error(error.message)
  return (data || []) as TeamRow[]
}

export async function loadTeamDetail(teamId: string): Promise<TeamDetail> {
  const teamResult = await supabase.from('teams').select('id, name, category, level, season, archived_at').eq('id', teamId).maybeSingle()
  if (teamResult.error) throw new Error(teamResult.error.message)
  if (!teamResult.data) throw new Error('Équipe introuvable ou non autorisée.')

  const [staffResult, membershipsResult] = await Promise.all([
    supabase.from('team_staff_assignments').select('id, team_id, profile_id, assignment_role, is_active, profile:profiles(id, full_name, email, role, is_active, profile_status)').eq('team_id', teamId).eq('is_active', true).order('created_at'),
    supabase.from('team_memberships').select('status, player:players(id, first_name, last_name, category, deleted_at, archived_at)').eq('team_id', teamId).eq('season', teamResult.data.season).eq('status', 'active'),
  ])
  if (staffResult.error) throw new Error(staffResult.error.message)
  if (membershipsResult.error) throw new Error(membershipsResult.error.message)

  const staff = ((staffResult.data || []) as unknown as StaffAssignment[]).filter((item) => item.profile)
  const players = (membershipsResult.data || []).flatMap((membership: any) => {
    const player = Array.isArray(membership.player) ? membership.player[0] : membership.player
    if (!player || player.deleted_at || player.archived_at) return []
    return [{ id: player.id, first_name: player.first_name, last_name: player.last_name, category: player.category, membership_status: membership.status }]
  })
  return { ...(teamResult.data as TeamRow), staff, players }
}

export async function loadAssignableProfiles(): Promise<StaffProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active, profile_status')
    .eq('is_active', true)
    .eq('profile_status', 'active')
    .order('full_name')
  if (error) throw new Error(error.message)
  return (data || []) as StaffProfile[]
}

export async function assignStaff(input: {
  teamId: string
  profileId: string
  role: StaffAssignmentRole
  currentAssignments?: StaffAssignment[]
  actorId?: string
}): Promise<void> {
  const { data, error } = await supabase.rpc('assign_team_staff', {
    target_team_id: input.teamId,
    target_profile_id: input.profileId,
    target_assignment_role: input.role,
  })
  if (error) throw new Error(error.message)
  if (!data || data.ok !== true || !data.assignment_id) throw new Error('L’affectation n’a pas été confirmée par le serveur.')
}

export async function removeStaff(input: { teamId?: string; assignment: StaffAssignment; currentAssignments?: StaffAssignment[] }): Promise<void> {
  const { data, error } = await supabase.rpc('remove_team_staff', { target_assignment_id: input.assignment.id })
  if (error) throw new Error(error.message)
  if (!data || data.ok !== true || data.assignment_id !== input.assignment.id) throw new Error('Le retrait n’a pas été confirmé par le serveur.')
}
