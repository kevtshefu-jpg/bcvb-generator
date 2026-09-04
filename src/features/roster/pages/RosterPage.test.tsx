import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RosterCapabilities, RosterMember, RosterTeam } from '../rosterModels'
import { RosterReadError, type RosterReadService } from '../rosterReadService'
import RosterPage from './RosterPage'

const authState = { profile: { id: 'profile-1' } }
vi.mock('../../auth/context/AuthContext', () => ({ useAuth: () => authState }))

const teams: RosterTeam[] = [
  { id: 'team-a', name: 'Équipe A', category: 'Seniors', level: 'Région', season: '2026-2027', archived_at: null },
  { id: 'team-b', name: 'Équipe B', category: 'U18', level: 'Départemental', season: '2026-2027', archived_at: null },
]
const allowed: RosterCapabilities = {
  canViewRoster: true, canManageRoster: false, canSearchPlayers: false, canCreatePlayer: false,
  canAddMembership: false, canDeactivateMembership: false, canArchivePlayer: false,
}
const member = (teamId: string, firstName: string): RosterMember => ({
  membershipId: `membership-${teamId}`, membershipStatus: 'active', playerId: `player-${teamId}`,
  firstName, lastName: 'Test', playerCategory: null, teamId,
  teamName: teamId === 'team-a' ? 'Équipe A' : 'Équipe B', teamCategory: 'Seniors', season: '2026-2027',
})

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => { resolve = done })
  return { promise, resolve }
}

beforeEach(() => { authState.profile.id = 'profile-1' })

describe('page Effectifs canonique', () => {
  it('affiche NO_TEAM_AVAILABLE sans fallback', async () => {
    const service = { getCapabilities: vi.fn(), readTeamRoster: vi.fn() } as unknown as RosterReadService
    render(<RosterPage loadTeamOptions={async () => []} service={service} />)
    expect(await screen.findByText('Aucune équipe disponible')).toBeInTheDocument()
    expect(service.getCapabilities).not.toHaveBeenCalled()
  })

  it('affiche READY, les données minimales et le contexte équipe-saison', async () => {
    const service = {
      getCapabilities: vi.fn(async () => allowed),
      readTeamRoster: vi.fn(async () => [member('team-a', 'Alice')]),
    } as unknown as RosterReadService
    render(<RosterPage loadTeamOptions={async () => teams} service={service} />)
    expect(await screen.findByText('Alice Test')).toBeInTheDocument()
    expect(screen.getAllByText(/2026-2027/).length).toBeGreaterThan(0)
    expect(screen.queryByText(/licence|téléphone|présence/i)).not.toBeInTheDocument()
  })

  it('affiche EMPTY et FORBIDDEN, sans appeler le roster en cas de refus', async () => {
    const service = {
      getCapabilities: vi.fn(async () => allowed), readTeamRoster: vi.fn(async () => []),
    } as unknown as RosterReadService
    const view = render(<RosterPage loadTeamOptions={async () => teams.slice(0, 1)} service={service} />)
    expect(await screen.findByText('Aucun joueur actif')).toBeInTheDocument()
    view.unmount()

    const denied = { ...allowed, canViewRoster: false }
    const deniedService = { getCapabilities: vi.fn(async () => denied), readTeamRoster: vi.fn() } as unknown as RosterReadService
    render(<RosterPage loadTeamOptions={async () => teams.slice(0, 1)} service={deniedService} />)
    expect(await screen.findByText('Effectif non accessible')).toBeInTheDocument()
    expect(deniedService.readTeamRoster).not.toHaveBeenCalled()
  })

  it('efface immédiatement l’ancien roster et ignore une réponse lente obsolète', async () => {
    const slow = deferred<RosterMember[]>()
    const service = {
      getCapabilities: vi.fn(async () => allowed),
      readTeamRoster: vi.fn((teamId: string) => teamId === 'team-a' ? slow.promise : Promise.resolve([member('team-b', 'Brune')])) ,
    } as unknown as RosterReadService
    render(<RosterPage loadTeamOptions={async () => teams} service={service} />)
    await waitFor(() => expect(service.readTeamRoster).toHaveBeenCalledWith('team-a'))
    fireEvent.change(screen.getByLabelText('Équipe'), { target: { value: 'team-b' } })
    expect(screen.queryByText('Alice Test')).not.toBeInTheDocument()
    expect(await screen.findByText('Brune Test')).toBeInTheDocument()
    await act(async () => slow.resolve([member('team-a', 'Alice')]))
    expect(screen.queryByText('Alice Test')).not.toBeInTheDocument()
  })

  it('rafraîchit manuellement la lecture canonique', async () => {
    const service = {
      getCapabilities: vi.fn(async () => allowed), readTeamRoster: vi.fn(async () => [member('team-a', 'Alice')]),
    } as unknown as RosterReadService
    render(<RosterPage loadTeamOptions={async () => teams.slice(0, 1)} service={service} />)
    await screen.findByText('Alice Test')
    fireEvent.click(screen.getByRole('button', { name: 'Actualiser l’effectif' }))
    await waitFor(() => expect(service.readTeamRoster).toHaveBeenCalledTimes(2))
  })

  it('présente les refus et erreurs techniques avec des messages contrôlés', async () => {
    const service = {
      getCapabilities: vi.fn(async () => { throw new RosterReadError('FORBIDDEN') }), readTeamRoster: vi.fn(),
    } as unknown as RosterReadService
    const view = render(<RosterPage loadTeamOptions={async () => teams.slice(0, 1)} service={service} />)
    expect(await screen.findByText('Effectif non accessible')).toBeInTheDocument()
    view.unmount()

    const failed = { getCapabilities: vi.fn(async () => { throw new Error('raw database message') }), readTeamRoster: vi.fn() } as unknown as RosterReadService
    render(<RosterPage loadTeamOptions={async () => teams.slice(0, 1)} service={failed} />)
    expect(await screen.findByText('Effectif indisponible')).toBeInTheDocument()
    expect(screen.queryByText('raw database message')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument()
  })

  it('ne présente aucun droit RT local au team_staff', () => {
    const source = RosterPage.toString()
    expect(source).not.toContain('profile.role')
    expect(source).not.toContain('getRosterPermissions')
  })
})
