import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { mapRosterCapabilities, mapRosterRows } from './rosterMapper'
import type { RosterFailureKind } from './rosterModels'

type RpcError = { code?: string; message?: string }

export class RosterReadError extends Error {
  constructor(public readonly kind: RosterFailureKind) {
    super(kind)
    this.name = 'RosterReadError'
  }
}

export function mapRosterReadError(error: unknown): RosterReadError {
  if (error instanceof RosterReadError) return error
  if (error instanceof Error && error.message === 'MALFORMED_ROSTER_RESPONSE') return new RosterReadError('MALFORMED')
  const candidate = error as RpcError | null
  if (candidate?.code === '42501') return new RosterReadError('FORBIDDEN')
  if (candidate?.code === '22023') return new RosterReadError('VALIDATION')
  if (candidate?.code === 'P0002') return new RosterReadError('NOT_FOUND')
  return new RosterReadError('TECHNICAL')
}

export function createRosterReadService(client: SupabaseClient) {
  return {
    async getCapabilities(teamId: string) {
      const { data, error } = await client.rpc('get_roster_capabilities', { target_team_id: teamId })
      if (error) throw mapRosterReadError(error)
      try {
        return mapRosterCapabilities(data)
      } catch (mappingError) {
        throw mapRosterReadError(mappingError)
      }
    },
    async readTeamRoster(teamId: string) {
      const { data, error } = await client.rpc('read_team_roster', {
        target_team_id: teamId,
        include_inactive: false,
      })
      if (error) throw mapRosterReadError(error)
      try {
        return mapRosterRows(data)
      } catch (mappingError) {
        throw mapRosterReadError(mappingError)
      }
    },
  }
}

export const rosterReadService = createRosterReadService(supabase)
export type RosterReadService = ReturnType<typeof createRosterReadService>
