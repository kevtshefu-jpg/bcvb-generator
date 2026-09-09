import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RosterManagementService } from '../rosterManagementService'
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
const managerCapabilities: RosterCapabilities = {
  ...allowed,
  canManageRoster: true,
  canSearchPlayers: true,
  canCreatePlayer: true,
  canAddMembership: true,
  canDeactivateMembership: true,
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
    expect(screen.queryByRole('button', { name: '+ Ajouter un joueur' })).not.toBeInTheDocument()
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

  it('reconstruit l’état canonique sans rester bloqué quand le profil change', async () => {
    const loadTeamOptions = vi.fn(async () => teams.slice(0, 1))
    const service = {
      getCapabilities: vi.fn(async () => allowed),
      readTeamRoster: vi.fn(async () => [member('team-a', authState.profile.id === 'profile-1' ? 'Alice' : 'Brune')]),
    } as unknown as RosterReadService
    const view = render(<RosterPage loadTeamOptions={loadTeamOptions} service={service} />)

    expect(await screen.findByText('Alice Test')).toBeInTheDocument()
    authState.profile.id = 'profile-2'
    view.rerender(<RosterPage loadTeamOptions={loadTeamOptions} service={service} />)

    expect(screen.queryByText('Alice Test')).not.toBeInTheDocument()
    await waitFor(() => expect(loadTeamOptions).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('Brune Test')).toBeInTheDocument()
    expect(service.getCapabilities).toHaveBeenCalledTimes(2)
    expect(service.readTeamRoster).toHaveBeenCalledTimes(2)
    expect(screen.queryByText('Chargement de l’effectif')).not.toBeInTheDocument()
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

  it('ouvre la recherche uniquement avec la capability serveur et affiche un résultat minimisé', async () => {
    const service = {
      getCapabilities: vi.fn(async () => managerCapabilities),
      readTeamRoster: vi.fn(async () => [member('team-a', 'Alice')]),
    } as unknown as RosterReadService
    const managementService = {
      searchPlayers: vi.fn(async () => ({
        matchState: 'EXACT' as const,
        candidates: [{
          playerId: 'player-existing', firstName: 'Emma', lastName: 'Exemple', birthYear: 2001,
          licenseHint: '••••0954', exactLicenseMatch: true, archived: false,
          activeMemberships: [{ teamId: 'team-a', teamName: 'Équipe A', season: '2026-2027' }],
          classification: 'EXACT' as const, reasons: ['LICENSE_AND_PROVIDED_IDENTITY_COHERENT'],
        }],
      })),
    } as unknown as RosterManagementService

    render(<RosterPage loadTeamOptions={async () => teams.slice(0, 1)} service={service} managementService={managementService} />)
    await screen.findByText('Alice Test')
    fireEvent.click(screen.getByRole('button', { name: '+ Ajouter un joueur' }))
    expect(screen.getByRole('heading', { name: 'Rechercher un joueur' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Emma' } })
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Exemple' } })
    fireEvent.click(screen.getByRole('button', { name: 'Rechercher' }))

    expect(await screen.findByText('Emma Exemple')).toBeInTheDocument()
    expect(screen.getByText('••••0954')).toBeInTheDocument()
    expect(screen.getByText('Correspondance exacte')).toBeInTheDocument()
    expect(managementService.searchPlayers).toHaveBeenCalledWith({ firstName: 'Emma', lastName: 'Exemple', licenseNumber: '', birthDate: '' })
    expect(screen.queryByText(/téléphone|email|adresse|médical/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /créer|sélectionner/i })).not.toBeInTheDocument()
  })

  it('bloque explicitement une ambiguïté sans candidat affichable', async () => {
    const service = {
      getCapabilities: vi.fn(async () => managerCapabilities),
      readTeamRoster: vi.fn(async () => [member('team-a', 'Alice')]),
    } as unknown as RosterReadService
    const managementService = {
      searchPlayers: vi.fn(async () => ({ matchState: 'AMBIGUOUS' as const, candidates: [] })),
    } as unknown as RosterManagementService

    render(<RosterPage loadTeamOptions={async () => teams.slice(0, 1)} service={service} managementService={managementService} />)
    await screen.findByText('Alice Test')
    fireEvent.click(screen.getByRole('button', { name: '+ Ajouter un joueur' }))
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Emma' } })
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Exemple' } })
    fireEvent.click(screen.getByRole('button', { name: 'Rechercher' }))

    expect(await screen.findByText('Vérification d’identité obligatoire.')).toBeInTheDocument()
    expect(screen.getByText(/Ne créez pas de nouveau joueur avant vérification/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /créer|sélectionner/i })).not.toBeInTheDocument()
  })

  it('signale une identité archivée sans proposer de mutation', async () => {
    const service = {
      getCapabilities: vi.fn(async () => managerCapabilities),
      readTeamRoster: vi.fn(async () => [member('team-a', 'Alice')]),
    } as unknown as RosterReadService
    const managementService = {
      searchPlayers: vi.fn(async () => ({
        matchState: 'AMBIGUOUS' as const,
        candidates: [{
          playerId: 'player-archived', firstName: 'Emma', lastName: 'Archive', birthYear: 2001,
          licenseHint: '••••0954', exactLicenseMatch: false, archived: true,
          activeMemberships: [], classification: 'AMBIGUOUS' as const, reasons: ['ARCHIVED_IDENTITY'],
        }],
      })),
    } as unknown as RosterManagementService

    render(<RosterPage loadTeamOptions={async () => teams.slice(0, 1)} service={service} managementService={managementService} />)
    await screen.findByText('Alice Test')
    fireEvent.click(screen.getByRole('button', { name: '+ Ajouter un joueur' }))
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Emma' } })
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Archive' } })
    fireEvent.click(screen.getByRole('button', { name: 'Rechercher' }))

    expect(await screen.findByText('Emma Archive')).toBeInTheDocument()
    expect(screen.getByText('Identité archivée')).toBeInTheDocument()
    expect(screen.getByText('Vérification nécessaire')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /créer|sélectionner/i })).not.toBeInTheDocument()
  })

  it('ferme et invalide la recherche quand l’équipe change', async () => {
    const slowSearch = deferred<{ matchState: 'EXACT'; candidates: [] }>()
    const service = {
      getCapabilities: vi.fn(async () => managerCapabilities),
      readTeamRoster: vi.fn(async (teamId: string) => [member(teamId, teamId === 'team-a' ? 'Alice' : 'Brune')]),
    } as unknown as RosterReadService
    const managementService = { searchPlayers: vi.fn(() => slowSearch.promise) } as unknown as RosterManagementService

    render(<RosterPage loadTeamOptions={async () => teams} service={service} managementService={managementService} />)
    await screen.findByText('Alice Test')
    fireEvent.click(screen.getByRole('button', { name: '+ Ajouter un joueur' }))
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Emma' } })
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Exemple' } })
    fireEvent.click(screen.getByRole('button', { name: 'Rechercher' }))
    fireEvent.change(screen.getByLabelText('Équipe'), { target: { value: 'team-b' } })

    expect(screen.queryByRole('heading', { name: 'Rechercher un joueur' })).not.toBeInTheDocument()
    expect(await screen.findByText('Brune Test')).toBeInTheDocument()
    await act(async () => slowSearch.resolve({ matchState: 'EXACT', candidates: [] }))
    expect(screen.queryByRole('heading', { name: 'Résultats' })).not.toBeInTheDocument()
  })

  it('ne présente aucun droit RT local au team_staff', () => {
    const source = RosterPage.toString()
    expect(source).not.toContain('profile.role')
    expect(source).not.toContain('getRosterPermissions')
  })
})
