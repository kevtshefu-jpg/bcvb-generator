import { describe, expect, it } from 'vitest'
import type { AttendanceSession } from '../../types/attendance'
import {
  deriveAttendanceOccurrences,
  type TrainingSlotExceptionRow,
  type TrainingSlotRow,
} from './attendanceOccurrences'

const slots: TrainingSlotRow[] = [
  { id: 'wed', team_id: 'rf3', season: '2026-2027', weekday: 3, start_time: '20:30:00', end_time: '22:00:00', location_name: 'Bointon', valid_from: '2026-08-31', valid_until: null, is_active: true },
  { id: 'fri', team_id: 'rf3', season: '2026-2027', weekday: 5, start_time: '20:30:00', end_time: '22:00:00', location_name: 'Palais', valid_from: '2026-08-31', valid_until: null, is_active: true },
]

function derive(overrides: Partial<Parameters<typeof deriveAttendanceOccurrences>[0]> = {}) {
  return deriveAttendanceOccurrences({ teamId: 'rf3', teamSeason: '2026-2027', today: '2026-08-31', slots, exceptions: [], sessions: [], pastDays: 0, futureDays: 7, ...overrides })
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

  it('accepte la saison canonique et exclut un créneau d’une autre saison', () => {
    expect(derive({ slots: [slots[0]] })).toHaveLength(1)
    expect(derive({ slots: [{ ...slots[0], season: '2025-2026' }] })).toHaveLength(0)
  })

  it('supprime une annulation et applique les valeurs effectives modified/moved', () => {
    const exceptions: TrainingSlotExceptionRow[] = [
      { training_slot_id: 'wed', exception_date: '2026-09-02', exception_type: 'cancelled', start_time: null, end_time: null, location_name: null },
      { training_slot_id: 'fri', exception_date: '2026-09-04', exception_type: 'modified', start_time: '19:30:00', end_time: '21:00:00', location_name: 'Annexe' },
    ]
    expect(derive({ exceptions })).toMatchObject([{ date: '2026-09-04', startTime: '19:30', endTime: '21:00', location: 'Annexe' }])
  })

  it.each([
    ['début seul', { start_time: '19:30:00', end_time: null, location_name: null }, { startTime: '19:30', endTime: '22:00', location: 'Bointon' }],
    ['fin seule', { start_time: null, end_time: '22:30:00', location_name: null }, { startTime: '20:30', endTime: '22:30', location: 'Bointon' }],
    ['lieu seul', { start_time: null, end_time: null, location_name: 'Annexe' }, { startTime: '20:30', endTime: '22:00', location: 'Annexe' }],
    ['combinée', { start_time: '19:30:00', end_time: '21:30:00', location_name: 'Annexe' }, { startTime: '19:30', endTime: '21:30', location: 'Annexe' }],
  ])('applique une exception modified isolée : %s', (_label, overrides, effective) => {
    expect(derive({ slots: [slots[0]], exceptions: [{ training_slot_id: 'wed', exception_date: '2026-09-02', exception_type: 'modified', ...overrides }] })).toMatchObject([effective])
  })

  it('traite moved comme override sur la même date sans inventer de date destination', () => {
    const occurrences = derive({ slots: [slots[0]], exceptions: [{ training_slot_id: 'wed', exception_date: '2026-09-02', exception_type: 'moved', start_time: '18:30:00', end_time: '20:00:00', location_name: 'Annexe' }] })
    expect(occurrences).toMatchObject([{ date: '2026-09-02', startTime: '18:30', endTime: '20:00', location: 'Annexe' }])
    expect(occurrences).toHaveLength(1)
  })

  it.each([
    ['passage DST de printemps Europe/Paris', '2026-03-22', ['2026-03-22', '2026-03-29', '2026-04-05']],
    ['passage DST d’automne Europe/Paris', '2026-10-18', ['2026-10-18', '2026-10-25', '2026-11-01']],
  ])('%s conserve dates, jours et heures murales', (_label, today, expectedDates) => {
    const sundaySlot: TrainingSlotRow = { ...slots[0], id: 'sunday', weekday: 7, start_time: '20:30:00', end_time: '22:00:00', valid_from: '2026-01-01' }
    const occurrences = deriveAttendanceOccurrences({ teamId: 'rf3', teamSeason: '2026-2027', today, slots: [sundaySlot], exceptions: [], sessions: [], pastDays: 0, futureDays: 14 })
    expect(occurrences.map((item) => item.date)).toEqual(expectedDates)
    expect(new Set(occurrences.map((item) => item.date)).size).toBe(3)
    expect(occurrences.every((item) => item.startTime === '20:30' && item.endTime === '22:00')).toBe(true)
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
