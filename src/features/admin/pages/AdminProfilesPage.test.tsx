import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AdminProfilesPage from './AdminProfilesPage'
import { listProfiles, type AdminProfileRow } from '../services/adminProfileManagementService'

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

const profiles: AdminProfileRow[] = [
  {
    id: 'member-1',
    full_name: 'Alice Martin',
    email: 'alice.martin@example.test',
    role: 'coach',
    is_active: true,
    profile_status: 'active',
    created_at: '2026-01-10T10:00:00.000Z',
    updated_at: '2026-01-11T10:00:00.000Z',
  },
  {
    id: 'member-2',
    full_name: 'Bruno Durand',
    email: 'bruno@example.test',
    role: 'member',
    is_active: false,
    profile_status: 'suspended',
    created_at: '2026-02-10T10:00:00.000Z',
    updated_at: null,
  },
  {
    id: 'member-3',
    full_name: 'Zoé Alpha',
    email: 'zoe.alpha@example.test',
    role: 'coach',
    is_active: true,
    profile_status: 'pending',
    created_at: '2026-03-10T10:00:00.000Z',
    updated_at: null,
  },
  {
    id: 'member-4',
    full_name: 'Élodie Bernard',
    email: 'elodie.bernard@example.test',
    role: 'dirigeant',
    is_active: true,
    profile_status: 'approved',
    created_at: '2026-04-10T10:00:00.000Z',
    updated_at: null,
  },
]

async function renderLoadedPage(rows = profiles) {
  mockedListProfiles.mockResolvedValue(rows)
  render(<AdminProfilesPage />)
  await waitFor(() => expect(mockedListProfiles).toHaveBeenCalledTimes(1))
  if (rows.length) await screen.findAllByText(rows[0].full_name!)
}

function desktopRows() {
  return within(document.querySelector('.admin-profiles-table tbody') as HTMLElement).getAllByRole('row')
}

function openFilters() {
  fireEvent.click(screen.getByText(/^Filtres(?: \(\d+\))?$/))
}

describe('recherche et filtres des membres', () => {
  beforeEach(() => {
    mockedListProfiles.mockReset()
  })

  it('charge les profils sans donnée simulée et expose immédiatement la recherche', async () => {
    await renderLoadedPage()

    expect(screen.getByRole('heading', { name: 'Gestion des membres' })).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Rechercher un membre' })).toBeVisible()
    expect(screen.getByText('4 profils affichés sur 4')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Actualiser' })).toHaveClass('bcvb-premium-button--ghost')
    expect(mockedListProfiles).toHaveBeenCalledTimes(1)
  })

  it('recherche par nom sans tenir compte de la casse, des accents ou des espaces superflus', async () => {
    await renderLoadedPage()

    fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher un membre' }), {
      target: { value: '  ZOE    alpha  ' },
    })

    expect(desktopRows()).toHaveLength(1)
    expect(within(desktopRows()[0]).getByText('Zoé Alpha')).toBeInTheDocument()
    expect(screen.getByText('1 profil affiché sur 4')).toBeInTheDocument()
  })

  it('recherche par email et efface la recherche sans recharger la page', async () => {
    await renderLoadedPage()
    const search = screen.getByRole('searchbox', { name: 'Rechercher un membre' })

    fireEvent.change(search, { target: { value: 'ELODIE.BERNARD@EXAMPLE.TEST' } })
    expect(desktopRows()).toHaveLength(1)
    expect(within(desktopRows()[0]).getByText('Élodie Bernard')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Effacer la recherche' }))
    expect(search).toHaveValue('')
    expect(desktopRows()).toHaveLength(4)
    expect(mockedListProfiles).toHaveBeenCalledTimes(1)
  })

  it('filtre par rôle et par statut actif ou inactif', async () => {
    await renderLoadedPage()
    openFilters()

    fireEvent.change(screen.getByLabelText('Rôle'), { target: { value: 'coach' } })
    expect(desktopRows()).toHaveLength(2)

    fireEvent.change(screen.getByLabelText('Statut'), { target: { value: 'inactive' } })
    expect(desktopRows()).toHaveLength(1)
    expect(within(desktopRows()[0]).getByText('Aucun profil trouvé')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Rôle'), { target: { value: 'member' } })
    expect(desktopRows()).toHaveLength(1)
    expect(within(desktopRows()[0]).getByText('Bruno Durand')).toBeInTheDocument()
  })

  it('combine recherche, rôle et état du profil puis réinitialise les filtres', async () => {
    await renderLoadedPage()
    openFilters()

    fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher un membre' }), {
      target: { value: 'alpha' },
    })
    fireEvent.change(screen.getByLabelText('Rôle'), { target: { value: 'coach' } })
    fireEvent.change(screen.getByLabelText('État du profil'), { target: { value: 'pending' } })

    expect(screen.getByText('1 profil affiché sur 4')).toBeInTheDocument()
    expect(screen.getByText('Filtres (2)')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser les filtres' }))
    expect(screen.getByLabelText('Rôle')).toHaveValue('all')
    expect(screen.getByLabelText('Statut')).toHaveValue('all')
    expect(screen.getByLabelText('État du profil')).toHaveValue('all')
    expect(screen.getByText('1 profil affiché sur 4')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Effacer la recherche' }))
    expect(screen.getByText('4 profils affichés sur 4')).toBeInTheDocument()
  })

  it('place les profils à traiter avant les profils validés puis trie par nom', async () => {
    await renderLoadedPage()

    expect(desktopRows().map((row) => row.querySelector('strong')?.textContent)).toEqual([
      'Bruno Durand',
      'Zoé Alpha',
      'Alice Martin',
      'Élodie Bernard',
    ])
  })

  it('distingue une liste vide, aucun résultat et une indisponibilité', async () => {
    await renderLoadedPage([])
    expect(screen.getAllByText('Aucune donnée n’a encore été créée.')).not.toHaveLength(0)
  })

  it('affiche aucun résultat pour une recherche sans correspondance', async () => {
    await renderLoadedPage()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher un membre' }), {
      target: { value: 'introuvable' },
    })

    expect(screen.getAllByText('Aucune donnée ne correspond aux filtres actuels.')).not.toHaveLength(0)
    expect(screen.getByText('0 profil affiché sur 4')).toBeInTheDocument()
  })

  it('affiche une erreur commune sans faux état vide ni données techniques ouvertes', async () => {
    mockedListProfiles.mockRejectedValue(new Error('permission denied for table profiles'))
    render(<AdminProfilesPage />)

    expect(await screen.findByText('Les profils n’ont pas pu être chargés.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeVisible()
    expect(screen.queryByText('Aucune donnée n’a encore été créée.')).not.toBeInTheDocument()
    expect(screen.getByText('Voir le détail technique').closest('details')).not.toHaveAttribute('open')
  })

  it('prévoit un tableau desktop et des cartes mobiles sans placeholder métier', async () => {
    await renderLoadedPage()

    expect(document.querySelector('.admin-profiles-tableWrap.responsive-data-table')).toBeInTheDocument()
    expect(document.querySelector('.admin-profiles-mobileList.responsive-data-mobile')).toBeInTheDocument()
    expect(screen.queryByText(/bientôt disponible/i)).not.toBeInTheDocument()
  })
})
