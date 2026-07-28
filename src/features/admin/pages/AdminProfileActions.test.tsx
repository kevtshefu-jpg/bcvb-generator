import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { isAdminAssignableRole } from '../../../config/roles'
import AdminProfilesPage from './AdminProfilesPage'
import {
  deactivateProfile,
  listProfiles,
  reactivateProfile,
  updateProfileRole,
  type AdminProfileRow,
} from '../services/adminProfileManagementService'

vi.mock('../../auth/context/AuthContext', () => ({
  useAuth: () => ({ profile: { id: 'admin-1', role: 'admin' } }),
}))

vi.mock('../services/adminProfileManagementService', () => ({
  listProfiles: vi.fn(),
  deactivateProfile: vi.fn(),
  reactivateProfile: vi.fn(),
  deleteProfile: vi.fn(),
  updateProfileRole: vi.fn(),
}))

const mockedListProfiles = vi.mocked(listProfiles)
const mockedDeactivateProfile = vi.mocked(deactivateProfile)
const mockedReactivateProfile = vi.mocked(reactivateProfile)
const mockedUpdateProfileRole = vi.mocked(updateProfileRole)

const activeCoach: AdminProfileRow = {
  id: 'coach-1',
  full_name: 'Coach Test',
  email: 'coach@example.test',
  role: 'coach',
  is_active: true,
  profile_status: 'active',
  created_at: null,
  updated_at: null,
}

const suspendedMember: AdminProfileRow = {
  ...activeCoach,
  id: 'member-1',
  full_name: 'Membre Suspendu',
  role: 'member',
  is_active: false,
  profile_status: 'suspended',
}

async function renderProfiles(rows: AdminProfileRow[]) {
  mockedListProfiles.mockResolvedValue(rows)
  render(<AdminProfilesPage />)
  await screen.findAllByText(rows[0].full_name!)
}

function desktopRow(name: string) {
  const table = document.querySelector('.admin-profiles-table') as HTMLElement
  return within(table).getByText(name).closest('tr') as HTMLElement
}

describe('rôles et statuts des membres', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('refuse toute valeur de rôle hors de la liste centralisée', () => {
    expect(isAdminAssignableRole('coach')).toBe(true)
    expect(isAdminAssignableRole('super_admin')).toBe(false)
    expect(isAdminAssignableRole('')).toBe(false)
  })

  it('modifie un rôle seulement après confirmation réelle du service', async () => {
    mockedUpdateProfileRole.mockResolvedValue({ ok: true, action: 'update_role', role: 'dirigeant' })
    await renderProfiles([activeCoach])

    fireEvent.click(within(desktopRow('Coach Test')).getByRole('button', { name: 'Gérer le rôle' }))
    fireEvent.change(screen.getByLabelText('Nouveau rôle'), { target: { value: 'dirigeant' } })
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le rôle' }))

    await waitFor(() => expect(mockedUpdateProfileRole).toHaveBeenCalledWith('coach-1', 'dirigeant'))
    expect(await screen.findByText('Rôle modifié.')).toBeInTheDocument()
    expect(mockedListProfiles).toHaveBeenCalledTimes(2)
  })

  it('exige une confirmation supplémentaire pour un rôle sensible', async () => {
    await renderProfiles([activeCoach])
    fireEvent.click(within(desktopRow('Coach Test')).getByRole('button', { name: 'Gérer le rôle' }))
    fireEvent.change(screen.getByLabelText('Nouveau rôle'), { target: { value: 'admin' } })

    const confirm = screen.getByRole('button', { name: 'Modifier le rôle' })
    expect(confirm).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Je confirme l’attribution de ce rôle sensible.' }))
    expect(confirm).toBeEnabled()
  })

  it('interdit toute modification de son propre rôle ou statut', async () => {
    await renderProfiles([{ ...activeCoach, id: 'admin-1', full_name: 'Admin courant', role: 'admin' }])
    const row = desktopRow('Admin courant')

    expect(within(row).getByRole('button', { name: 'Gérer le rôle' })).toBeDisabled()
    expect(within(row).getByRole('button', { name: 'Suspendre' })).toBeDisabled()
  })

  it('protège le dernier administrateur actif', async () => {
    await renderProfiles([{ ...activeCoach, id: 'admin-2', full_name: 'Dernier Admin', role: 'admin' }])

    expect(within(desktopRow('Dernier Admin')).getByRole('button', { name: 'Suspendre' })).toBeDisabled()
  })

  it('suspend un profil après confirmation et sans disparition optimiste', async () => {
    let resolveAction: ((value: Awaited<ReturnType<typeof deactivateProfile>>) => void) | undefined
    mockedDeactivateProfile.mockImplementation(() => new Promise((resolve) => { resolveAction = resolve }))
    await renderProfiles([activeCoach])

    fireEvent.click(within(desktopRow('Coach Test')).getByRole('button', { name: 'Suspendre' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Suspendre le profil' })).getByRole('button', { name: 'Suspendre' }))

    expect(screen.getByRole('button', { name: 'Traitement...' })).toBeDisabled()
    expect(screen.getAllByText('Coach Test')).not.toHaveLength(0)
    expect(screen.queryByText('Profil suspendu.')).not.toBeInTheDocument()

    resolveAction?.({ ok: true, action: 'deactivate' })
    expect(await screen.findByText('Profil suspendu.')).toBeInTheDocument()
    expect(mockedListProfiles).toHaveBeenCalledTimes(2)
  })

  it('réactive un profil suspendu', async () => {
    mockedReactivateProfile.mockResolvedValue({ ok: true, action: 'reactivate' })
    await renderProfiles([suspendedMember])

    fireEvent.click(within(desktopRow('Membre Suspendu')).getByRole('button', { name: 'Réactiver' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Réactiver le profil' })).getByRole('button', { name: 'Réactiver' }))

    await waitFor(() => expect(mockedReactivateProfile).toHaveBeenCalledWith('member-1'))
    expect(await screen.findByText('Profil réactivé.')).toBeInTheDocument()
  })

  it('conserve l’état affiché et ne montre aucun succès après une erreur serveur', async () => {
    mockedUpdateProfileRole.mockRejectedValue(new Error('server rejected role update'))
    await renderProfiles([activeCoach])

    fireEvent.click(within(desktopRow('Coach Test')).getByRole('button', { name: 'Gérer le rôle' }))
    fireEvent.change(screen.getByLabelText('Nouveau rôle'), { target: { value: 'dirigeant' } })
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le rôle' }))

    expect(await screen.findByText('Cette action n’a pas pu être effectuée.')).toBeInTheDocument()
    expect(screen.queryByText('Rôle modifié.')).not.toBeInTheDocument()
    expect(within(desktopRow('Coach Test')).getByText('Coach')).toBeInTheDocument()
    expect(mockedListProfiles).toHaveBeenCalledTimes(1)
  })
})
