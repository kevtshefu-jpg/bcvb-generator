import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AdminProfileRequestsPage from './AdminProfileRequestsPage'
import {
  approveProfileRequest,
  fetchProfileRequests,
  rejectProfileRequest,
  type ProfileRequestRow,
} from '../services/profileRequestService'

vi.mock('../services/profileRequestService', () => ({
  fetchProfileRequests: vi.fn(),
  approveProfileRequest: vi.fn(),
  rejectProfileRequest: vi.fn(),
}))

const pending: ProfileRequestRow = {
  id: 'request-1', user_id: 'member-1', email: 'alice@bcvb.test', full_name: 'Alice Martin',
  requested_role: 'coach', requested_category_id: 'U15', requested_team: null, phone: null,
  motivation: 'Encadrer une équipe', message: null, status: 'pending', admin_note: null,
  decided_by: null, decided_at: null, created_at: '2026-07-31T10:00:00Z', updated_at: '2026-07-31T10:00:00Z',
}

describe('AdminProfileRequestsPage', () => {
  beforeEach(() => {
    vi.mocked(fetchProfileRequests).mockReset().mockResolvedValue([pending])
    vi.mocked(approveProfileRequest).mockReset()
    vi.mocked(rejectProfileRequest).mockReset()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('affiche la demande pending, le rôle demandé et les rôles finaux centralisés', async () => {
    render(<AdminProfileRequestsPage />)
    expect(await screen.findByText('Alice Martin')).toBeInTheDocument()
    expect(screen.getAllByText('Coach')).toHaveLength(2)
    expect(screen.getByRole('option', { name: 'Responsable technique' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Valider le profil' })).toBeEnabled()
  })

  it('attend la confirmation serveur et bloque les deux actions pendant l’approbation', async () => {
    let resolveApproval!: (row: ProfileRequestRow) => void
    vi.mocked(approveProfileRequest).mockReturnValue(new Promise((resolve) => { resolveApproval = resolve }))
    render(<AdminProfileRequestsPage />)
    await screen.findByText('Alice Martin')

    fireEvent.click(screen.getByRole('button', { name: 'Valider le profil' }))
    expect(screen.getByRole('button', { name: 'Validation...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Refuser' })).toBeDisabled()
    expect(screen.queryByText(/Demande validée/)).not.toBeInTheDocument()

    resolveApproval({ ...pending, status: 'approved' })
    expect(await screen.findByText('Demande validée pour Alice Martin.')).toBeInTheDocument()
  })

  it('conserve la demande et n’affiche aucun faux succès après une erreur serveur', async () => {
    vi.mocked(approveProfileRequest).mockRejectedValue(new Error('PT409'))
    render(<AdminProfileRequestsPage />)
    await screen.findByText('Alice Martin')
    fireEvent.click(screen.getByRole('button', { name: 'Valider le profil' }))

    await waitFor(() => expect(screen.getByText('Alice Martin')).toBeInTheDocument())
    expect(screen.queryByText(/Demande validée/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Valider le profil' })).toBeEnabled()
  })

  it('refuse avec une note facultative après confirmation', async () => {
    vi.mocked(rejectProfileRequest).mockResolvedValue({ ...pending, status: 'rejected' })
    render(<AdminProfileRequestsPage />)
    await screen.findByText('Alice Martin')
    fireEvent.change(screen.getByPlaceholderText(/Décision/), { target: { value: 'Dossier incomplet' } })
    fireEvent.click(screen.getByRole('button', { name: 'Refuser' }))
    await waitFor(() => expect(rejectProfileRequest).toHaveBeenCalledWith('request-1', 'Dossier incomplet'))
  })
})
