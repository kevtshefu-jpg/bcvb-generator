import type { RosterCapabilities, RosterMember } from './rosterModels'

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requiredString(row: UnknownRecord, field: string): string {
  const value = row[field]
  if (typeof value !== 'string' || value.length === 0) throw new Error('MALFORMED_ROSTER_RESPONSE')
  return value
}

function requiredBoolean(row: UnknownRecord, field: string): boolean {
  const value = row[field]
  if (typeof value !== 'boolean') throw new Error('MALFORMED_ROSTER_RESPONSE')
  return value
}

export function mapRosterCapabilities(value: unknown): RosterCapabilities {
  const rows = Array.isArray(value) ? value : []
  if (rows.length !== 1 || !isRecord(rows[0])) throw new Error('MALFORMED_ROSTER_RESPONSE')
  const row = rows[0]
  return {
    canViewRoster: requiredBoolean(row, 'can_view_roster'),
    canManageRoster: requiredBoolean(row, 'can_manage_roster'),
    canSearchPlayers: requiredBoolean(row, 'can_search_players'),
    canCreatePlayer: requiredBoolean(row, 'can_create_player'),
    canAddMembership: requiredBoolean(row, 'can_add_membership'),
    canDeactivateMembership: requiredBoolean(row, 'can_deactivate_membership'),
    canArchivePlayer: requiredBoolean(row, 'can_archive_player'),
  }
}

export function mapRosterRows(value: unknown): RosterMember[] {
  if (!Array.isArray(value)) throw new Error('MALFORMED_ROSTER_RESPONSE')
  return value.map((item) => {
    if (!isRecord(item)) throw new Error('MALFORMED_ROSTER_RESPONSE')
    const playerCategory = item.player_category
    if (playerCategory !== null && typeof playerCategory !== 'string') throw new Error('MALFORMED_ROSTER_RESPONSE')
    return {
      membershipId: requiredString(item, 'membership_id'),
      membershipStatus: requiredString(item, 'membership_status'),
      playerId: requiredString(item, 'player_id'),
      firstName: requiredString(item, 'first_name'),
      lastName: requiredString(item, 'last_name'),
      playerCategory,
      teamId: requiredString(item, 'team_id'),
      teamName: requiredString(item, 'team_name'),
      teamCategory: requiredString(item, 'team_category'),
      season: requiredString(item, 'season'),
    }
  })
}
