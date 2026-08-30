import { describe, expect, it } from 'vitest'
import type { AttendanceSession } from '../../types/attendance'
import {
  deriveAttendanceOccurrences,
  type TrainingSlotExceptionRow,
  type TrainingSlotRow,
} from './attendanceOccurrences'

const slots: TrainingSlotRow[] = [
  { id: 'wed', team_id: 'rf3', weekday: 3, start_time: '20:30:00', end_time: '22:00:00', location_name: 'Bointon', valid_from: '2026-08-31', valid_until: null, is_active: true },
  { id: 'fri', team_id: 'rf3', weekday: 5, start_time: '20:30:00', end_time: '22:00:00', location_name: 'Palais', valid_from: '2026-08-31', valid_until: null, is_active: true },
]

function derive(overrides: Partial<Parameters<typeof deriveAttendanceOccurrences>[0]> = {}) {
  return deriveAttendanceOccurrences({ teamId: 'rf3', today: '2026-08-31', slots, exceptions: [], sessions: [], pastDays: 0, futureDays: 7, ...overrides })
}

describe('occurrences Attendance issues du planning', () => {
  it('génère les mercredi et vendredi réels sans les persister', () => {
    expect(derive().map(({ date, startTime, endTime, location, state }) => ({ date, startTime, endTime, location, state }))).toEqual([
      { date: '2026-09-02', startTime: '20:30', endTime: '22:00', location: 'Bointon', state: 'upcoming' },
      { date: '2026-09-04', startTime: '20:30', endTime: '22:00', location: 'Palais', state: 'upcoming' },
    ])
  })

  it('respecte valid_from, valid_until et is_active', () => {
    expect(derive({ slots: [{ ...slots[0], valid_from: '2026-09-03' }] })).toHaveLength(0)
    expect(derive({ slots: [{ ...slots[0], valid_until: '2026-09-01' }] })).toHaveLength(0)
    expect(derive({ slots: [{ ...slots[0], is_active: false }] })).toHaveLength(0)
  })

  it('supprime une annulation et applique les valeurs effectives modified/moved', () => {
    const exceptions: TrainingSlotExceptionRow[] = [
      { training_slot_id: 'wed', exception_date: '2026-09-02', exception_type: 'cancelled', start_time: null, end_time: null, location_name: null },
      { training_slot_id: 'fri', exception_date: '2026-09-04', exception_type: 'modified', start_time: '19:30:00', end_time: '21:00:00', location_name: 'Annexe' },
    ]
    expect(derive({ exceptions })).toMatchObject([{ date: '2026-09-04', startTime: '19:30', endTime: '21:00', location: 'Annexe' }])
  })

  it('ne réutilise pas un brouillon historique sans training_slot_id', () => {
    const historical: AttendanceSession = {
      id: 'unknown', teamId: 'rf3', date: '2026-08-30', title: 'Appel séance', type: 'entrainement',
      createdBy: 'actor', createdAt: '2026-08-30T10:00:00Z', updatedAt: '2026-08-30T10:00:00Z',
    }
    const occurrences = derive({ sessions: [historical], pastDays: 2 })
    expect(occurrences.every((occurrence) => occurrence.session === undefined)).toBe(true)
    expect(historical.trainingSlotId).toBeUndefined()
  })

  it('distingue occurrence future, brouillon et séance validée', () => {
    const base: AttendanceSession = {
      id: 'call', teamId: 'rf3', trainingSlotId: 'wed', date: '2026-09-02', startTime: '20:30', endTime: '22:00',
      location: 'Bointon', title: 'Entraînement · Bointon', type: 'entrainement', createdBy: 'actor', createdAt: '', updatedAt: '',
    }
    expect(derive({ sessions: [base] })[0].state).toBe('draft')
    expect(derive({ sessions: [{ ...base, locked: true }] })[0].state).toBe('validated')
  })
})
