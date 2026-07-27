import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AdminProfilesPage from './AdminProfilesPage'
import { listProfiles } from '../services/adminProfileManagementService'

vi.mock('../../auth/context/AuthContext', () => ({
  useAuth: () => ({ profile: { id: 'admin-1', role: 'admin' } }),
}))

vi.mock('../services/adminProfileManagementService', () => ({
  listProfiles: vi.fn(),
  deactivateProfile: vi.fn(),
  reactivateProfile: vi.fn(),
  deleteProfile: vi.fn(),
}))

const mockedListProfiles = vi.mocked(listProfiles)

describe('page de référence de gestion des membres', () => {
  beforeEach(() => {
    mockedListProfiles.mockReset()
  })

  it('charge les profils réels et expose immédiatement la recherche', async () => {
    mockedListProfiles.mockResolvedValue([
      {
        id: 'member-1',
        full_name: 'Marie Martin',
        email: 'marie@example.test',
        role: 'coach',
        is_active: true,
        profile_status: 'active',
        created_at: '2026-01-10T10:00:00.000Z',
        updated_at: '2026-01-11T10:00:00.000Z',
      },
    ])

    render(<AdminProfilesPage />)

    expect(screen.getByRole('heading', { name: 'Gestion des membres' })).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Recherche' })).toBeVisible()
    expect(screen.getAllByText('Chargement des profils')).not.toHaveLength(0)
    await waitFor(() => expect(mockedListProfiles).toHaveBeenCalledTimes(1))
    expect(await screen.findAllByText('Marie Martin')).not.toHaveLength(0)
    expect(screen.queryByText(/placeholder/i)).not.toBeInTheDocument()
  })

  it('distingue une base vide d’un filtre sans résultat', async () => {
    mockedListProfiles.mockResolvedValue([])
    const { rerender } = render(<AdminProfilesPage />)

    expect(await screen.findAllByText('Aucune donnée n’a encore été créée.')).not.toHaveLength(0)

    mockedListProfiles.mockResolvedValue([
      {
        id: 'member-2',
        full_name: 'Jean Dupont',
        email: 'jean@example.test',
        role: 'member',
        is_active: true,
        profile_status: 'active',
        created_at: null,
        updated_at: null,
      },
    ])
    rerender(<AdminProfilesPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Actualiser' }))
    await screen.findAllByText('Jean Dupont')
    fireEvent.change(screen.getByRole('searchbox', { name: 'Recherche' }), { target: { value: 'introuvable' } })

    expect(screen.getAllByText('Aucune donnée ne correspond aux filtres actuels.')).not.toHaveLength(0)
  })

  it('affiche une erreur commune sans rendre un faux état vide', async () => {
    mockedListProfiles.mockRejectedValue(new Error('permission denied for table profiles'))
    render(<AdminProfilesPage />)

    expect(await screen.findByText('Les profils n’ont pas pu être chargés.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeVisible()
    expect(screen.queryByText('Aucune donnée n’a encore été créée.')).not.toBeInTheDocument()
  })
})
