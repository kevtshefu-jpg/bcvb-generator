import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TechnicalDashboard from './TechnicalDashboard'
import { fetchTechnicalDashboard } from './technicalDashboardService'

vi.mock('./technicalDashboardService', () => ({ fetchTechnicalDashboard: vi.fn() }))

const response = {
  teams: [{ id: 'team-a', name: 'U13 Région', category: 'U13', level: 'Région', season: '2026', head_coach_id: null, assistant_coach_ids: [] }],
  staffAssignments: [],
  profiles: [],
  pendingRegistrations: 1,
  pendingProfileRequests: 0,
  unreadAdminNotifications: 0,
}

describe('TechnicalDashboard', () => {
  beforeEach(() => vi.mocked(fetchTechnicalDashboard).mockReset().mockResolvedValue(response))

  it('affiche les données Supabase et les liens prioritaires corrects', async () => {
    render(<MemoryRouter><TechnicalDashboard role="responsable_technique" /></MemoryRouter>)
    expect(await screen.findAllByText('U13 Région')).toHaveLength(2)
    expect(screen.getByText('Coach principal manquant')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ouvrir la fiche équipe' })).toHaveAttribute('href', '/club/equipes/team-a')
    expect(screen.getByRole('link', { name: 'Inscriptions' })).toHaveAttribute('href', '/admin/inscriptions')
    expect(screen.getByText('Aucun planning partagé exploitable')).toBeInTheDocument()
    expect(screen.getByText('Coach adjoint : non renseigné · Parent référent : non renseigné')).toBeInTheDocument()
    expect(screen.queryByText('Staff incomplet')).not.toBeInTheDocument()
    expect(screen.queryByText(/Postes à couvrir/)).not.toBeInTheDocument()
  })

  it('affiche un état vide sans donnée simulée', async () => {
    vi.mocked(fetchTechnicalDashboard).mockResolvedValue({ ...response, teams: [], pendingRegistrations: 0 })
    render(<MemoryRouter><TechnicalDashboard role="admin" /></MemoryRouter>)
    expect(await screen.findByText('Aucune équipe ne correspond à ce filtre.')).toBeInTheDocument()
    expect(screen.queryByText('U13 Région')).not.toBeInTheDocument()
  })

  it('conserve un état d’erreur et permet de relancer le chargement', async () => {
    vi.mocked(fetchTechnicalDashboard).mockRejectedValueOnce(new Error('indisponible')).mockResolvedValueOnce(response)
    render(<MemoryRouter><TechnicalDashboard role="admin" /></MemoryRouter>)
    expect(await screen.findByText('Données indisponibles')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    await waitFor(() => expect(screen.getAllByText('U13 Région')).toHaveLength(2))
  })

  it('adapte la vue dirigeant sans exposer les actions administratives', async () => {
    vi.mocked(fetchTechnicalDashboard).mockResolvedValue({ ...response, staffAssignments: null, profiles: null, pendingRegistrations: null, pendingProfileRequests: null, unreadAdminNotifications: null })
    render(<MemoryRouter><TechnicalDashboard role="dirigeant" /></MemoryRouter>)
    expect(await screen.findByText('Les affectations nominatives sont réservées à la direction technique et à l’administration.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Inscriptions' })).not.toBeInTheDocument()
  })
})
