import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { StaffProfile, TeamDetail } from '../../features/teams/teamManagementService'
import { TeamStaffPanel } from './TeamStaffPanel'

const { assignStaff, removeStaff } = vi.hoisted(() => ({ assignStaff: vi.fn(), removeStaff: vi.fn() }))
vi.mock('../../features/teams/teamManagementService', async (importOriginal) => ({ ...(await importOriginal()), assignStaff, removeStaff }))

const coach: StaffProfile = { id: 'p2', full_name: 'Nouveau Coach', email: 'coach@club.test', role: 'coach', is_active: true, profile_status: 'active' }
const team: TeamDetail = { id: 't1', name: 'U15', category: 'U15', level: 'Régional', season: '2026-2027', archived_at: null, players: [], staff: [] }

describe('TeamStaffPanel', () => {
  beforeEach(() => { assignStaff.mockReset(); removeStaff.mockReset() })

  it('affiche assistant et parent référent comme optionnels non renseignés', () => {
    render(<TeamStaffPanel team={team} profiles={[coach]} canManage={false} onSaved={vi.fn()} />)
    expect(screen.getByText('Assistant').parentElement).toHaveTextContent('Non renseigné')
    expect(screen.getByText('Parent référent').parentElement).toHaveTextContent('Non renseigné')
  })

  it('n’affiche aucune action de modification à un coach non autorisé', () => {
    render(<TeamStaffPanel team={team} profiles={[coach]} canManage={false} onSaved={vi.fn()} />)
    expect(screen.queryByText('Confirmer l’affectation')).not.toBeInTheDocument()
  })

  it('confirme une affectation seulement après succès serveur', async () => {
    assignStaff.mockResolvedValue(undefined)
    const onSaved = vi.fn().mockResolvedValue(undefined)
    render(<TeamStaffPanel team={team} profiles={[coach]} canManage actorId="admin" onSaved={onSaved} />)
    await userEvent.selectOptions(screen.getByLabelText('Profil actif'), 'p2')
    await userEvent.click(screen.getByText('Confirmer l’affectation'))
    expect(assignStaff).toHaveBeenCalledOnce()
    expect(onSaved).toHaveBeenCalledOnce()
    expect(await screen.findByText('Affectation confirmée par le serveur.')).toBeInTheDocument()
  })

  it('ne présente aucun faux succès en cas d’erreur serveur', async () => {
    assignStaff.mockRejectedValue(new Error('RLS refuse cette écriture'))
    render(<TeamStaffPanel team={team} profiles={[coach]} canManage onSaved={vi.fn()} />)
    await userEvent.selectOptions(screen.getByLabelText('Profil actif'), 'p2')
    await userEvent.click(screen.getByText('Confirmer l’affectation'))
    expect(await screen.findByRole('alert')).toHaveTextContent('RLS refuse cette écriture')
    expect(screen.queryByText(/Affectation confirmée/)).not.toBeInTheDocument()
  })

  it('propose explicitement le remplacement quand un coach principal existe', () => {
    const current = { ...team, staff: [{ id: 'a1', team_id: 't1', profile_id: 'p1', assignment_role: 'head_coach' as const, is_active: true, profile: { ...coach, id: 'p1', full_name: 'Coach Actuel' } }] }
    render(<TeamStaffPanel team={current} profiles={[coach]} canManage onSaved={vi.fn()} />)
    expect(screen.getByText('Remplacer le coach principal')).toBeInTheDocument()
  })
})
