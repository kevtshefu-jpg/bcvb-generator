import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  classifyRf3SchedulePrecheck,
  createApprovedScheduleForTeam,
  type Rf3SchedulePrecheck,
} from '../services/rf3ScheduleInitializationService'
import Rf3ScheduleInitialization from './Rf3ScheduleInitialization'

const { authState, precheck, createApprovedSchedule } = vi.hoisted(() => ({
  authState: {
    session: { access_token: 'test-session' } as object | null,
    profile: { role: 'admin', is_active: true, profile_status: 'active' } as {
      role: string
      is_active: boolean
      profile_status: string
    } | null,
  },
  precheck: vi.fn(),
  createApprovedSchedule: vi.fn(),
}))

const baseCounts = {
  teamCount: 1,
  playerCount: 7,
  membershipCount: 7,
  activeHeadCoachCount: 1,
  exactWednesdayCount: 0,
  exactFridayCount: 0,
  unexpectedRf3SlotCount: 0,
  facilityConflictCount: 0,
}

const ready = { ...baseCounts, state: 'READY' as const }
const initialized = { ...baseCounts, exactWednesdayCount: 1, exactFridayCount: 1, state: 'ALREADY_INITIALIZED' as const }
const partial = { ...baseCounts, exactWednesdayCount: 1, state: 'PARTIAL' as const }
const conflict = { ...baseCounts, facilityConflictCount: 1, state: 'CONFLICT' as const }
const errorState = { ...baseCounts, playerCount: 6, state: 'ERROR' as const }

vi.mock('../../auth/context/AuthContext', () => ({ useAuth: () => authState }))
vi.mock('../services/rf3ScheduleInitializationService', async (importOriginal) => {
  const original = await importOriginal<typeof import('../services/rf3ScheduleInitializationService')>()
  return {
    ...original,
    rf3ScheduleInitializationService: { precheck, createApprovedSchedule },
  }
})

async function renderWithState(state: Rf3SchedulePrecheck = ready) {
  precheck.mockResolvedValue(state)
  render(<Rf3ScheduleInitialization />)
  await screen.findByText(state.state === 'READY' ? 'Prêt' : state.state === 'ALREADY_INITIALIZED' ? 'Initialisé' : state.state === 'PARTIAL' ? 'Revue humaine requise' : state.state === 'CONFLICT' ? 'Conflit' : 'Indisponible')
}

async function openConfirmation() {
  await userEvent.click(screen.getByRole('button', { name: 'Créer les 2 créneaux RF3' }))
  return screen.getByRole('button', { name: 'Confirmer la création des 2 créneaux' })
}

describe('Rf3ScheduleInitialization', () => {
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
  ])('est inaccessible pour %s', (_label, session, profile) => {
    authState.session = session
    authState.profile = profile
    render(<Rf3ScheduleInitialization />)
    expect(screen.queryByText('Planning pilote RF3')).not.toBeInTheDocument()
    expect(precheck).not.toHaveBeenCalled()
  })

  it.each(['admin', 'responsable_technique', 'technical_manager'])('est visible pour un profil actif %s', async (role) => {
    authState.profile = { role, is_active: true, profile_status: 'active' }
    await renderWithState()
    expect(screen.getByRole('button', { name: 'Créer les 2 créneaux RF3' })).toBeEnabled()
  })

  it.each([
    ['ALREADY_INITIALIZED', initialized, 'Planning RF3 déjà initialisé'],
    ['PARTIAL', partial, 'Créer les 2 créneaux RF3'],
    ['CONFLICT', conflict, 'Créer les 2 créneaux RF3'],
    ['ERROR', errorState, 'Créer les 2 créneaux RF3'],
  ])('verrouille l’action dans l’état %s', async (_label, state, buttonName) => {
    await renderWithState(state)
    expect(screen.getByRole('button', { name: buttonName })).toBeDisabled()
    expect(createApprovedSchedule).not.toHaveBeenCalled()
  })

  it('affiche la revue humaine pour un état partiel', async () => {
    await renderWithState(partial)
    expect(screen.getByText(/PARTIAL — REVUE HUMAINE REQUISE/)).toBeInTheDocument()
  })

  it('annule sans mutation', async () => {
    await renderWithState()
    await openConfirmation()
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(createApprovedSchedule).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('ferme avec Échap sans mutation', async () => {
    await renderWithState()
    await openConfirmation()
    fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(createApprovedSchedule).not.toHaveBeenCalled()
  })

  it('limite un double clic à une seule séquence de mutation', async () => {
    let resolveWrite: ((value: { status: 'TWO_CREATED'; created: ['wednesday', 'friday'] }) => void) | undefined
    createApprovedSchedule.mockImplementation(() => new Promise((resolve) => { resolveWrite = resolve }))
    precheck.mockResolvedValueOnce(ready).mockResolvedValueOnce(initialized)
    render(<Rf3ScheduleInitialization />)
    const confirm = await openConfirmation()
    fireEvent.click(confirm)
    fireEvent.click(confirm)
    expect(createApprovedSchedule).toHaveBeenCalledTimes(1)
    resolveWrite?.({ status: 'TWO_CREATED', created: ['wednesday', 'friday'] })
    expect(await screen.findByText('Planning RF3 initialisé')).toBeInTheDocument()
  })

  it('confirme deux créations, relit puis verrouille uniquement sur l’état exact', async () => {
    precheck.mockResolvedValueOnce(ready).mockResolvedValueOnce(initialized)
    createApprovedSchedule.mockResolvedValue({ status: 'TWO_CREATED', created: ['wednesday', 'friday'] })
    render(<Rf3ScheduleInitialization />)
    await userEvent.click(await openConfirmation())
    expect(await screen.findByText('Planning RF3 initialisé')).toBeInTheDocument()
    expect(precheck).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('button', { name: 'Planning RF3 déjà initialisé' })).toBeDisabled()
  })

  it('ne lance pas la seconde mutation après un échec du premier appel', async () => {
    precheck.mockResolvedValue(ready)
    createApprovedSchedule.mockResolvedValue({ status: 'FIRST_FAILED', created: [], failed: 'wednesday' })
    render(<Rf3ScheduleInitialization />)
    await userEvent.click(await openConfirmation())
    expect(await screen.findByText(/Création interrompue avant le créneau/)).toBeInTheDocument()
    expect(createApprovedSchedule).toHaveBeenCalledTimes(1)
  })

  it('verrouille en PARTIAL après un échec du second appel, sans retry ni suppression', async () => {
    precheck.mockResolvedValue(ready)
    createApprovedSchedule.mockResolvedValue({ status: 'PARTIAL', created: ['wednesday'], failed: 'friday' })
    render(<Rf3ScheduleInitialization />)
    await userEvent.click(await openConfirmation())
    expect(await screen.findByText(/Le créneau du mercredi à Bointon existe/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Créer les 2 créneaux RF3' })).toBeDisabled()
    expect(createApprovedSchedule).toHaveBeenCalledTimes(1)
  })

  it('ne revendique pas le succès si le readback ne correspond pas', async () => {
    precheck.mockResolvedValueOnce(ready).mockResolvedValueOnce(conflict)
    createApprovedSchedule.mockResolvedValue({ status: 'TWO_CREATED', created: ['wednesday', 'friday'] })
    render(<Rf3ScheduleInitialization />)
    await userEvent.click(await openConfirmation())
    expect(await screen.findByText(/contrôle final ne correspond pas/)).toBeInTheDocument()
    expect(screen.queryByText('Planning RF3 initialisé')).not.toBeInTheDocument()
  })

  it.each([390, 768, 1440])('présente uniquement les données approuvées à %d px', async (width) => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
    await renderWithState()
    expect(screen.getByText('20:30–22:00 · Bointon')).toBeInTheDocument()
    expect(screen.getByText('20:30–22:00 · Palais')).toBeInTheDocument()
    expect(screen.queryByText(/joueuse|email|access_token/i)).not.toBeInTheDocument()
  })

  it('réutilise les contrats responsive, tactiles et de focus visibles', () => {
    const css = readFileSync(join(process.cwd(), 'src/features/admin/components/Rf3PilotInitialization.css'), 'utf8')
    expect(css).toContain('min-height: 44px')
    expect(css).toContain(':focus-visible')
    expect(css).toContain('max-width: 100%')
    expect(css).toContain('overflow-y: auto')
    expect(css).toContain('@media (max-width: 900px)')
    expect(css).toContain('@media (max-width: 520px)')
  })

  it('n’introduit aucun bypass ni effet de bord Attendance', () => {
    const service = readFileSync(join(process.cwd(), 'src/features/admin/services/rf3ScheduleInitializationService.ts'), 'utf8')
    expect(service).toContain('saveTrainingSlot')
    expect(service).not.toMatch(/service_role|attendance_sessions|attendance_records|\.insert\(|\.delete\(/)
  })
})

describe('classification fail-closed du planning RF3', () => {
  it.each([
    ['READY', baseCounts],
    ['ALREADY_INITIALIZED', { ...baseCounts, exactWednesdayCount: 1, exactFridayCount: 1 }],
    ['PARTIAL', { ...baseCounts, exactWednesdayCount: 1 }],
    ['CONFLICT', { ...baseCounts, unexpectedRf3SlotCount: 1 }],
    ['ERROR', { ...baseCounts, activeHeadCoachCount: 0 }],
  ])('classe %s', (expected, input) => {
    expect(classifyRf3SchedulePrecheck(input).state).toBe(expected)
  })
})

describe('séquence canonique des deux RPC', () => {
  it('appelle exactement mercredi puis vendredi une seule fois', async () => {
    const save = vi.fn().mockResolvedValue({ conflicts: [] })
    await expect(createApprovedScheduleForTeam('team-rf3', save)).resolves.toEqual({
      status: 'TWO_CREATED',
      created: ['wednesday', 'friday'],
    })
    expect(save).toHaveBeenCalledTimes(2)
    expect(save.mock.calls[0]?.[0]).toMatchObject({ team_id: 'team-rf3', weekday: 3, location_name: 'Bointon' })
    expect(save.mock.calls[1]?.[0]).toMatchObject({ team_id: 'team-rf3', weekday: 5, location_name: 'Palais' })
  })

  it('arrête la séquence sans retry si le premier appel échoue', async () => {
    const save = vi.fn().mockRejectedValue(new Error('server detail'))
    await expect(createApprovedScheduleForTeam('team-rf3', save)).resolves.toEqual({
      status: 'FIRST_FAILED',
      created: [],
      failed: 'wednesday',
    })
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('signale PARTIAL sans retry ni suppression si le second appel échoue', async () => {
    const save = vi.fn()
      .mockResolvedValueOnce({ conflicts: [] })
      .mockRejectedValueOnce(new Error('server detail'))
    await expect(createApprovedScheduleForTeam('team-rf3', save)).resolves.toEqual({
      status: 'PARTIAL',
      created: ['wednesday'],
      failed: 'friday',
    })
    expect(save).toHaveBeenCalledTimes(2)
  })
})
