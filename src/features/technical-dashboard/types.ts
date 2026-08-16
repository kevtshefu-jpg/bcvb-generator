export type TechnicalDashboardRole = 'admin' | 'responsable_technique' | 'dirigeant'

export type TechnicalTeamRow = {
  id: string
  name: string
  category: string
  level: string
  season: string
  head_coach_id: string | null
  assistant_coach_ids: string[]
}

export type TechnicalStaffAssignmentRow = {
  team_id: string
  profile_id: string
  assignment_role: string
  is_active: boolean
}

export type TechnicalProfileRow = {
  id: string
  full_name: string | null
  email: string
  role: string
}

export type TechnicalDashboardSource = {
  teams: TechnicalTeamRow[]
  staffAssignments: TechnicalStaffAssignmentRow[] | null
  profiles: TechnicalProfileRow[] | null
  pendingRegistrations: number | null
  pendingProfileRequests: number | null
  unreadAdminNotifications: number | null
}

export type TechnicalTeamSummary = TechnicalTeamRow & {
  hasHeadCoach: boolean
  hasAssistantCoach: boolean
  hasParentReferent: boolean | null
  staffMembers: Array<{ id: string; name: string; role: string }> | null
}

export type TechnicalDashboardModel = {
  teams: TechnicalTeamSummary[]
  categories: string[]
  teamCount: number
  teamsWithoutHeadCoach: number
  assignedCoachCount: number | null
  parentReferentCount: number | null
  alerts: Array<{ id: string; label: string; count: number; path: string | null }>
}
