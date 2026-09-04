import type { TeamRow } from '../teams/teamManagementService'

export type RosterTeam = TeamRow

export type RosterCapabilities = {
  canViewRoster: boolean
  canManageRoster: boolean
  canSearchPlayers: boolean
  canCreatePlayer: boolean
  canAddMembership: boolean
  canDeactivateMembership: boolean
  canArchivePlayer: boolean
}

export type RosterMember = {
  membershipId: string
  membershipStatus: string
  playerId: string
  firstName: string
  lastName: string
  playerCategory: string | null
  teamId: string
  teamName: string
  teamCategory: string
  season: string
}

export type RosterPageStatus =
  | 'LOADING'
  | 'READY'
  | 'EMPTY'
  | 'FORBIDDEN'
  | 'ERROR'
  | 'NO_TEAM_AVAILABLE'

export type RosterFailureKind = 'FORBIDDEN' | 'VALIDATION' | 'NOT_FOUND' | 'TECHNICAL' | 'MALFORMED'
