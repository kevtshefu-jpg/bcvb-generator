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

export type RosterSearchMatchState = 'EXACT' | 'PROBABLE' | 'AMBIGUOUS' | 'NO_MATCH'

export type RosterSearchMembership = {
  teamId: string
  teamName: string
  season: string
}

export type RosterSearchCandidate = {
  playerId: string
  firstName: string
  lastName: string
  birthYear: number | null
  licenseHint: string | null
  exactLicenseMatch: boolean
  archived: boolean
  activeMemberships: RosterSearchMembership[]
  classification: Exclude<RosterSearchMatchState, 'NO_MATCH'>
  reasons: string[]
}

export type RosterSearchResult = {
  matchState: RosterSearchMatchState
  candidates: RosterSearchCandidate[]
}

export type RosterSearchInput = {
  firstName: string
  lastName: string
  licenseNumber: string
  birthDate: string
}

export type RosterPageStatus =
  | 'LOADING'
  | 'READY'
  | 'EMPTY'
  | 'FORBIDDEN'
  | 'ERROR'
  | 'NO_TEAM_AVAILABLE'

export type RosterFailureKind = 'FORBIDDEN' | 'VALIDATION' | 'NOT_FOUND' | 'TECHNICAL' | 'MALFORMED'
