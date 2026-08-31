import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { AttendanceSession } from '../../types/attendance'
import { AttendanceSessionSelector } from './AttendanceSessionSelector'

const historical: AttendanceSession = {
  id: 'unknown-origin',
  teamId: 'rf3',
  date: '2026-08-30',
  title: 'Appel séance',
  type: 'entrainement',
  createdBy: 'actor',
  createdAt: '2026-08-30T10:00:00Z',
  updatedAt: '2026-08-30T10:00:00Z',
}

function renderSelector(session: AttendanceSession | null, canCreateOccurrence = true) {
  render(
    <AttendanceSessionSelector
      session={session}
      sessions={[historical]}
      teams={[{ id: 'rf3', name: 'RF3 - SF', category: 'Seniors', season: '2026-2027' }]}
      selectedTeamId="rf3"
      canCreateOccurrence={canCreateOccurrence}
      onTeamChange={vi.fn()}
      onSessionChange={vi.fn()}
      occurrences={[{
        id: 'slot-wed:2026-09-02', trainingSlotId: 'slot-wed', teamId: 'rf3', date: '2026-09-02',
        startTime: '20:30', endTime: '22:00', location: 'Bointon', title: 'Entraînement · Bointon', state: 'upcoming',
      }]}
      onOpenOccurrence={vi.fn()}
    />,
  )
}

describe('sélecteur Attendance planning et historique', () => {
  it('laisse le planning primaire tout en gardant l’appel historique sélectionnable', () => {
    renderSelector(null)

    expect(screen.getByRole('option', { name: 'Sélectionner un appel historique' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Appel hors planning · Appel séance/ })).toBeInTheDocument()
    expect(screen.getByText('20:30–22:00 · Bointon')).toBeInTheDocument()
  })

  it('laisse naviguer en lecture seule sans matérialiser une occurrence absente', () => {
    renderSelector(null, false)

    expect(screen.getByRole('combobox', { name: 'Équipe' })).toBeEnabled()
    expect(screen.getByRole('combobox', { name: 'Appel' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Appel non ouvert' })).toBeDisabled()
  })

  it('identifie le contexte incomplet sans inventer horaire ni lieu', () => {
    renderSelector(historical)

    expect(screen.getAllByText('Appel hors planning').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Non renseigné')).toHaveLength(2)
    expect(screen.getByText('2026-08-30')).toBeInTheDocument()
  })
})
