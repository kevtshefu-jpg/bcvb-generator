import { describe, expect, it, vi } from 'vitest'
import { createRosterManagementService, RosterManagementError } from './rosterManagementService'

describe('rosterManagementService player search', () => {
  it('appelle uniquement search_players_for_roster avec un payload minimisé', async () => {
    const rpc = vi.fn(async () => ({
      data: {
        match_state: 'EXACT',
        candidates: [{
          player_id: 'player-1', first_name: 'Alice', last_name: 'Test', birth_year: 2004,
          license_hint: '••••4726', exact_license_match: true, archived: false,
          active_memberships: [{ team_id: 'team-1', team_name: 'RF3 - SF', season: '2026-2027' }],
          classification: 'EXACT', reasons: ['LICENSE_AND_PROVIDED_IDENTITY_COHERENT'],
        }],
      },
      error: null,
    }))
    const service = createRosterManagementService({ rpc } as never)

    const result = await service.searchPlayers({ firstName: ' Alice ', lastName: ' Test ', licenseNumber: ' VT052472 ', birthDate: '' 

describe('rosterManagementService player creation', () => {
  it('appelle create_player_for_roster sans créer de membership', async () => {
    const rpc = vi.fn(async () => ({ data: { status: 'CREATED', player_id: 'player-new', match_state: 'NO_MATCH', idempotent_replay: false }, error: null }))
    const service = createRosterManagementService({ rpc } as never)
    const result = await service.createPlayer({
      operationId: '11111111-1111-4111-8111-111111111111', firstName: ' Emma ', lastName: ' Nouvelle ',
      birthDate: '2001-01-02', licenseNumber: ' VT123 ', confirmDistinctPerson: false,
      acknowledgedCandidateIds: [], distinctPersonReason: '',
    })
    expect(rpc).toHaveBeenCalledWith('create_player_for_roster', expect.objectContaining({
      operation_id: '11111111-1111-4111-8111-111111111111', target_first_name: 'Emma', target_last_name: 'Nouvelle',
      target_birth_date: '2001-01-02', target_license_number: 'VT123', confirm_distinct_person: false,
      acknowledged_candidate_ids: [], distinct_person_reason: null,
    }))
    expect(rpc).not.toHaveBeenCalledWith('add_or_reactivate_team_membership', expect.anything())
    expect(result).toEqual(expect.objectContaining({ status: 'CREATED', playerId: 'player-new', idempotentReplay: false }))
  })

  it('exige candidats reconnus et justification pour DISTINCT_PERSON', async () => {
    const rpc = vi.fn()
    const service = createRosterManagementService({ rpc } as never)
    await expect(service.createPlayer({
      operationId: '11111111-1111-4111-8111-111111111111', firstName: 'Emma', lastName: 'Nouvelle',
      birthDate: '', licenseNumber: '', confirmDistinctPerson: true, acknowledgedCandidateIds: [], distinctPersonReason: '',
    })).rejects.toEqual(expect.objectContaining({ kind: 'VALIDATION' }))
    expect(rpc).not.toHaveBeenCalled()
  })

  it('mappe un conflit serveur sans le transformer en succès', async () => {
    const rpc = vi.fn(async () => ({ data: { status: 'CONFLICT', player_id: null, match_state: 'EXACT', candidate_ids: ['player-existing'] }, error: null }))
    const service = createRosterManagementService({ rpc } as never)
    const result = await service.createPlayer({
      operationId: '11111111-1111-4111-8111-111111111111', firstName: 'Emma', lastName: 'Nouvelle',
      birthDate: '', licenseNumber: '', confirmDistinctPerson: false, acknowledgedCandidateIds: [], distinctPersonReason: '',
    })
    expect(result.status).toBe('CONFLICT')
    expect(result.candidateIds).toEqual(['player-existing'])
  })
})

    expect(rpc).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith('search_players_for_roster', {
      target_first_name: 'Alice', target_last_name: 'Test', target_license_number: 'VT052472', target_birth_date: null, result_limit: 20,
    })
    expect(result.matchState).toBe('EXACT')
    expect(result.candidates[0]).toEqual(expect.objectContaining({
      playerId: 'player-1', firstName: 'Alice', lastName: 'Test', birthYear: 2004, licenseHint: '••••4726', exactLicenseMatch: true,
    }))
  })

  it('refuse localement une recherche sans licence ni prénom+nom', async () => {
    const rpc = vi.fn()
    const service = createRosterManagementService({ rpc } as never)
    await expect(service.searchPlayers({ firstName: 'Alice', lastName: '', licenseNumber: '', birthDate: '' }))
      .rejects.toEqual(expect.objectContaining({ kind: 'VALIDATION' }))
    expect(rpc).not.toHaveBeenCalled()
  })

  it('mappe les refus serveur sans exposer le message brut', async () => {
    const rpc = vi.fn(async () => ({ data: null, error: { code: '42501', message: 'secret database detail' } }))
    const service = createRosterManagementService({ rpc } as never)
    await expect(service.searchPlayers({ firstName: 'Alice', lastName: 'Test', licenseNumber: '', birthDate: '' }))
      .rejects.toBeInstanceOf(RosterManagementError)
    await expect(service.searchPlayers({ firstName: 'Alice', lastName: 'Test', licenseNumber: '', birthDate: '' }))
      .rejects.toEqual(expect.objectContaining({ kind: 'FORBIDDEN' }))
  })

  it('rejette une réponse RPC malformée', async () => {
    const rpc = vi.fn(async () => ({ data: { match_state: 'EXACT', candidates: [{ player_id: 'player-1' }] }, error: null }))
    const service = createRosterManagementService({ rpc } as never)
    await expect(service.searchPlayers({ firstName: 'Alice', lastName: 'Test', licenseNumber: '', birthDate: '' }))
      .rejects.toEqual(expect.objectContaining({ kind: 'MALFORMED' }))
  })
})
