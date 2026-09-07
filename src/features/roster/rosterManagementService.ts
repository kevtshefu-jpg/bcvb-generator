import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import type {
  RosterFailureKind,
  RosterSearchCandidate,
  RosterSearchInput,
  RosterSearchMatchState,
  RosterSearchMembership,
  RosterSearchResult,
} from './rosterModels'

type RpcError = { code?: string; message?: string }
type UnknownRecord = Record<string, unknown>

const MATCH_STATES: RosterSearchMatchState[] = ['EXACT', 'PROBABLE', 'AMBIGUOUS', 'NO_MATCH']
const CANDIDATE_STATES: RosterSearchCandidate['classification'][] = ['EXACT', 'PROBABLE', 'AMBIGUOUS']

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requiredString(row: UnknownRecord, field: string): string {
  const value = row[field]
  if (typeof value !== 'string' || value.length === 0) throw new Error('MALFORMED_ROSTER_RESPONSE')
  return value
}

function optionalString(row: UnknownRecord, field: string): string | null {
  const value = row[field]
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') throw new Error('MALFORMED_ROSTER_RESPONSE')
  return value
}

function mapMembership(value: unknown): RosterSearchMembership {
  if (!isRecord(value)) throw new Error('MALFORMED_ROSTER_RESPONSE')
  return {
    teamId: requiredString(value, 'team_id'),
    teamName: requiredString(value, 'team_name'),
    season: requiredString(value, 'season'),
  }
}

function mapCandidate(value: unknown): RosterSearchCandidate {
  if (!isRecord(value)) throw new Error('MALFORMED_ROSTER_RESPONSE')
  const classification = value.classification
  if (typeof classification !== 'string' || !CANDIDATE_STATES.includes(classification as RosterSearchCandidate['classification'])) {
    throw new Error('MALFORMED_ROSTER_RESPONSE')
  }
  const birthYear = value.birth_year
  if (birthYear !== null && birthYear !== undefined && (typeof birthYear !== 'number' || !Number.isInteger(birthYear))) {
    throw new Error('MALFORMED_ROSTER_RESPONSE')
  }
  const memberships = value.active_memberships
  const reasons = value.reasons
  if (!Array.isArray(memberships) || !Array.isArray(reasons) || reasons.some((reason) => typeof reason !== 'string')) {
    throw new Error('MALFORMED_ROSTER_RESPONSE')
  }
  if (typeof value.exact_license_match !== 'boolean' || typeof value.archived !== 'boolean') {
    throw new Error('MALFORMED_ROSTER_RESPONSE')
  }
  return {
    playerId: requiredString(value, 'player_id'),
    firstName: requiredString(value, 'first_name'),
    lastName: requiredString(value, 'last_name'),
    birthYear: birthYear ?? null,
    licenseHint: optionalString(value, 'license_hint'),
    exactLicenseMatch: value.exact_license_match,
    archived: value.archived,
    activeMemberships: memberships.map(mapMembership),
    classification: classification as RosterSearchCandidate['classification'],
    reasons: reasons as string[],
  }
}

export function mapRosterSearchResult(value: unknown): RosterSearchResult {
  if (!isRecord(value)) throw new Error('MALFORMED_ROSTER_RESPONSE')
  const matchState = value.match_state
  if (typeof matchState !== 'string' || !MATCH_STATES.includes(matchState as RosterSearchMatchState) || !Array.isArray(value.candidates)) {
    throw new Error('MALFORMED_ROSTER_RESPONSE')
  }
  return {
    matchState: matchState as RosterSearchMatchState,
    candidates: value.candidates.map(mapCandidate),
  }
}

export class RosterManagementError extends Error {
  constructor(public readonly kind: RosterFailureKind) {
    super(kind)
    this.name = 'RosterManagementError'
  }
}

export function mapRosterManagementError(error: unknown): RosterManagementError {
  if (error instanceof RosterManagementError) return error
  if (error instanceof Error && error.message === 'MALFORMED_ROSTER_RESPONSE') return new RosterManagementError('MALFORMED')
  const candidate = error as RpcError | null
  if (candidate?.code === '42501') return new RosterManagementError('FORBIDDEN')
  if (candidate?.code === '22023') return new RosterManagementError('VALIDATION')
  if (candidate?.code === 'P0002') return new RosterManagementError('NOT_FOUND')
  return new RosterManagementError('TECHNICAL')
}

export function createRosterManagementService(client: SupabaseClient) {
  return {
    async searchPlayers(input: RosterSearchInput): Promise<RosterSearchResult> {
      const firstName = input.firstName.trim()
      const lastName = input.lastName.trim()
      const licenseNumber = input.licenseNumber.trim()
      const birthDate = input.birthDate.trim()
      if (!licenseNumber && (!firstName || !lastName)) throw new RosterManagementError('VALIDATION')

      const { data, error } = await client.rpc('search_players_for_roster', {
        target_first_name: firstName || null,
        target_last_name: lastName || null,
        target_license_number: licenseNumber || null,
        target_birth_date: birthDate || null,
        result_limit: 20,
      })
      if (error) throw mapRosterManagementError(error)
      try {
        return mapRosterSearchResult(data)
      } catch (mappingError) {
        throw mapRosterManagementError(mappingError)
      }
    },
  }
}

export const rosterManagementService = createRosterManagementService(supabase)
export type RosterManagementService = ReturnType<typeof createRosterManagementService>
