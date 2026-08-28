import type { TechnicalDashboardModel, TechnicalDashboardSource } from './types'
import { getPlanningLocalDay } from '../operational-planning/planningLocalDate'

export function buildTechnicalDashboardModel(source: TechnicalDashboardSource, instant: Date = new Date(), timeZone?: string): TechnicalDashboardModel {
  const assignments = source.staffAssignments
  const profileById = new Map((source.profiles || []).map((profile) => [profile.id, profile]))
  const teams = source.teams.map((team) => {
    const teamAssignments = assignments?.filter((item) => item.team_id === team.id && item.is_active) || null
    const hasHeadCoach = Boolean(team.head_coach_id) || Boolean(teamAssignments?.some((item) => item.assignment_role === 'head_coach'))
    const hasAssistant = Boolean(team.assistant_coach_ids?.length) || Boolean(teamAssignments?.some((item) => item.assignment_role === 'assistant_coach'))
    const hasParentReferent = teamAssignments ? teamAssignments.some((item) => item.assignment_role === 'parent_referent') : null
    const staffRoles = new Map<string, string>()
    if (team.head_coach_id) staffRoles.set(team.head_coach_id, 'Coach principal')
    team.assistant_coach_ids.forEach((id) => staffRoles.set(id, 'Coach adjoint'))
    teamAssignments?.forEach((assignment) => {
      const labels: Record<string, string> = { head_coach: 'Coach principal', assistant_coach: 'Coach adjoint', team_staff: 'Responsable d’équipe', parent_referent: 'Parent référent' }
      staffRoles.set(assignment.profile_id, labels[assignment.assignment_role] || assignment.assignment_role)
    })

    return {
      ...team,
      hasHeadCoach,
      hasAssistantCoach: hasAssistant,
      hasParentReferent,
      staffMembers: assignments === null ? null : [...staffRoles].map(([id, role]) => {
        const profile = profileById.get(id)
        return { id, role, name: profile?.full_name?.trim() || profile?.email || 'Profil sans nom' }
      }),
    }
  })

  const alerts: TechnicalDashboardModel['alerts'] = []
  if (source.pendingRegistrations !== null && source.pendingRegistrations > 0) alerts.push({ id: 'registrations', label: 'Inscriptions à traiter', count: source.pendingRegistrations, path: '/admin/inscriptions' })
  if (source.pendingProfileRequests !== null && source.pendingProfileRequests > 0) alerts.push({ id: 'profiles', label: 'Demandes de profil à traiter', count: source.pendingProfileRequests, path: '/admin/demandes-profils' })
  const withoutHeadCoach = teams.filter((team) => !team.hasHeadCoach).length
  if (withoutHeadCoach > 0) alerts.push({ id: 'head-coach', label: 'Équipes sans coach principal', count: withoutHeadCoach, path: '/club/equipes' })
  if (source.unreadAdminNotifications !== null && source.unreadAdminNotifications > 0) alerts.push({ id: 'notifications', label: 'Notifications non lues', count: source.unreadAdminNotifications, path: null })
  const localDay = getPlanningLocalDay(instant, timeZone)
  const isoDate = localDay.date
  const todayWeekday = localDay.weekday
  const activeSlots = source.trainingSlots.filter(slot => slot.is_active && slot.valid_from <= isoDate && (!slot.valid_until || slot.valid_until >= isoDate))
  const schedule = activeSlots.map(slot => {
    const team = source.teams.find(item => item.id === slot.team_id)
    const hasConflict = activeSlots.some(other => other.id !== slot.id && other.weekday === slot.weekday && Boolean(slot.location_name?.trim()) && slot.location_name?.trim().toLowerCase() === other.location_name?.trim().toLowerCase() && slot.start_time < other.end_time && slot.end_time > other.start_time)
    return { ...slot, teamName: team?.name || 'Équipe', category: team?.category || '', isToday: slot.weekday === todayWeekday, hasConflict }
  }).sort((a,b)=>Number(b.isToday)-Number(a.isToday)||a.weekday-b.weekday||a.start_time.localeCompare(b.start_time))
  const teamsWithoutActiveSlot = source.teams.filter(team => !activeSlots.some(slot => slot.team_id === team.id)).length

  return {
    teams,
    categories: [...new Set(teams.map((team) => team.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr')),
    teamCount: teams.length,
    teamsWithoutHeadCoach: withoutHeadCoach,
    assignedCoachCount: assignments === null ? null : new Set(assignments.filter((item) => ['head_coach', 'assistant_coach'].includes(item.assignment_role)).map((item) => item.profile_id)).size,
    parentReferentCount: assignments === null ? null : new Set(assignments.filter((item) => item.assignment_role === 'parent_referent').map((item) => item.profile_id)).size,
    alerts,
    schedule,
    teamsWithoutActiveSlot,
  }
}
