import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Rf3PilotInitialization from './Rf3PilotInitialization'

const { authState, precheck, importPilot } = vi.hoisted(() => ({
  authState: {
    session: { access_token: 'test-session' } as object | null,
    profile: { role: 'admin', is_active: true, profile_status: 'active' } as {
      role: string
      is_active: boolean
      profile_status: string
    } | null,
  },
  precheck: vi.fn(),
  importPilot: vi.fn(),
}))

const ready = { teams: 0, players: 0, memberships: 0, staff: 0, kevinCandidates: 1, state: 'ready' as const }
const initialized = { teams: 1, players: 7, memberships: 7, staff: 1, kevinCandidates: 1, state: 'initialized' as const }
const imported = {
  status: 'IMPORTED' as const,
  team_created: 1,
  team_reused: 0,
  players_created: 7,
  players_reused: 0,
  memberships_created: 7,
  memberships_reused: 0,
  staff_created: 1,
  staff_reused: 0,
}

vi.mock('../../auth/context/AuthContext', () => ({ useAuth: () => authState }))
vi.mock('../services/rf3PilotImportService', () => ({
  rf3PilotImportService: { precheck, importPilot },
}))

async function renderReady() {
  precheck.mockResolvedValue(ready)
  render(<Rf3PilotInitialization />)
  await screen.findByRole('button', { name: 'Importer le pilote RF3' })
}

async function openConfirmation() {
  await userEvent.click(screen.getByRole('button', { name: 'Importer le pilote RF3' }))
  return screen.getByRole('button', { name: 'Confirmer l’import' })
}

describe('Rf3PilotInitialization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.session = { access_token: 'test-session' }
    authState.profile = { role: 'admin', is_active: true, profile_status: 'active' }
  })

  it.each([
    ['non authentifié', null, null],
    ['coach', { access_token: 'test-session' }, { role: 'coach', is_active: true, profile_status: 'active' }],
    ['dirigeant', { access_token: 'test-session' }, { role: 'dirigeant', is_active: true, profile_status: 'active' }],
    ['joueur', { access_token: 'test-session' }, { role: 'joueur', is_active: true, profile_status: 'active' }],
    ['admin inactif', { access_token: 'test-session' }, { role: 'admin', is_active: false, profile_status: 'active' }],
  ])('reste inaccessible pour %s', (_label, session, profile) => {
    authState.session = session
    authState.profile = profile
    render(<Rf3PilotInitialization />)
    expect(screen.queryByText('Initialisation pilote RF3')).not.toBeInTheDocument()
    expect(precheck).not.toHaveBeenCalled()
  })

  it('est visible pour un admin actif et annule sans appeler la RPC', async () => {
    await renderReady()
    await openConfirmation()
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(importPilot).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('limite un double clic de confirmation à une seule invocation', async () => {
    let resolveImport: ((value: typeof imported) => void) | undefined
    importPilot.mockImplementation(() => new Promise((resolve) => { resolveImport = resolve }))
    precheck.mockResolvedValueOnce(ready).mockResolvedValueOnce(initialized)
    render(<Rf3PilotInitialization />)
    const confirm = await openConfirmation()
    fireEvent.click(confirm)
    fireEvent.click(confirm)
    expect(importPilot).toHaveBeenCalledTimes(1)
    resolveImport?.(imported)
    await screen.findByText('Import RF3 terminé')
  })

  it('ne relance jamais automatiquement après une erreur', async () => {
    precheck.mockResolvedValue(ready)
    importPilot.mockRejectedValue(new Error('detail sensible'))
    render(<Rf3PilotInitialization />)
    await userEvent.click(await openConfirmation())
    await screen.findByRole('alert')
    expect(importPilot).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('detail sensible')).not.toBeInTheDocument()
  })

  it('affiche le résultat puis verrouille après IMPORTED', async () => {
    precheck.mockResolvedValueOnce(ready).mockResolvedValueOnce(initialized)
    importPilot.mockResolvedValue(imported)
    render(<Rf3PilotInitialization />)
    await userEvent.click(await openConfirmation())
    expect(await screen.findByText('Import RF3 terminé')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pilote RF3 déjà initialisé' })).toBeDisabled()
    expect(importPilot).toHaveBeenCalledTimes(1)
  })

  it('verrouille sans invocation quand le pilote est déjà initialisé', async () => {
    precheck.mockResolvedValue(initialized)
    render(<Rf3PilotInitialization />)
    expect(await screen.findByRole('button', { name: 'Pilote RF3 déjà initialisé' })).toBeDisabled()
    expect(importPilot).not.toHaveBeenCalled()
  })

  it('verrouille après un résultat ALREADY_IMPORTED', async () => {
    precheck.mockResolvedValueOnce(ready).mockResolvedValueOnce(initialized)
    importPilot.mockResolvedValue({
      ...imported,
      status: 'ALREADY_IMPORTED',
      team_created: 0,
      team_reused: 1,
      players_created: 0,
      players_reused: 7,
      memberships_created: 0,
      memberships_reused: 7,
      staff_created: 0,
      staff_reused: 1,
    })
    render(<Rf3PilotInitialization />)
    await userEvent.click(await openConfirmation())
    expect(await screen.findByText('ALREADY_IMPORTED')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pilote RF3 déjà initialisé' })).toBeDisabled()
    expect(importPilot).toHaveBeenCalledTimes(1)
  })

  it('désactive l’import lorsque le précheck est incohérent', async () => {
    precheck.mockResolvedValue({ ...ready, players: 1, state: 'inconsistent' })
    render(<Rf3PilotInitialization />)
    expect(await screen.findByRole('button', { name: 'Importer le pilote RF3' })).toBeDisabled()
    expect(screen.getByText(/ne permet pas un import sûr/i)).toBeInTheDocument()
  })

  it.each([390, 768, 1440])('reste rendu sans donnée sensible à %d px', async (width) => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
    await renderReady()
    expect(screen.getByText('RF3 - SF')).toBeInTheDocument()
    expect(screen.queryByText(/date de naissance|access_token|@/i)).not.toBeInTheDocument()
  })

  it('offre une cible tactile et un focus visible dans le contrat CSS', async () => {
    const css = readFileSync(join(process.cwd(), 'src/features/admin/components/Rf3PilotInitialization.css'), 'utf8')
    expect(css).toContain('min-height: 44px')
    expect(css).toContain(':focus-visible')
    expect(css).toContain('@media (max-width: 900px)')
    expect(css).toContain('@media (max-width: 520px)')
  })

  it('ferme le dialogue avec Échap sans invocation', async () => {
    await renderReady()
    await openConfirmation()
    fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(importPilot).not.toHaveBeenCalled()
  })
})
