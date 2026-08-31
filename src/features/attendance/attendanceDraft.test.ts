import { describe, expect, it } from 'vitest'
import type { AttendanceDraft, AttendancePlayer, AttendanceSession } from '../../types/attendance'
import { isAttendanceDraftForSession, setAttendanceDraftStatusForPlayers } from './attendanceDraft'

const session: AttendanceSession = {
  id: 'session-a',
  teamId: 'team-a',
  trainingSlotId: 'slot-a',
  date: '2026-09-02',
  startTime: '20:30',
  location: 'Bointon',
  title: 'Entraînement · Bointon',
  type: 'entrainement',
  createdBy: 'actor',
  createdAt: '2026-08-31T10:00:00Z',
  updatedAt: '2026-08-31T10:00:00Z',
}

function draft(overrides: Partial<AttendanceSession> = {}): AttendanceDraft {
  const draftSession = { ...session, ...overrides }
  return {
    session: draftSession,
    records: [{
      id: 'draft-record',
      sessionId: draftSession.id,
      teamId: draftSession.teamId,
      playerId: 'player-a',
      status: 'present',
      updatedAt: '2026-08-31T10:01:00Z',
    }],
    updatedAt: '2026-08-31T10:01:00Z',
  }
}

describe('propriété des brouillons Attendance locaux', () => {
  it('accepte uniquement le brouillon de la séance et de l’occurrence exactes', () => {
    expect(isAttendanceDraftForSession(draft(), session)).toBe(true)
    expect(isAttendanceDraftForSession(draft({ id: 'session-b' }), session)).toBe(false)
    expect(isAttendanceDraftForSession(draft({ teamId: 'team-b' }), session)).toBe(false)
    expect(isAttendanceDraftForSession(draft({ date: '2026-09-04' }), session)).toBe(false)
    expect(isAttendanceDraftForSession(draft({ trainingSlotId: 'slot-b' }), session)).toBe(false)
  })

  it('rejette un record rattaché à une autre séance ou équipe', () => {
    const wrongSession = draft()
    wrongSession.records[0].sessionId = 'session-b'
    expect(isAttendanceDraftForSession(wrongSession, session)).toBe(false)

    const wrongTeam = draft()
    wrongTeam.records[0].teamId = 'team-b'
    expect(isAttendanceDraftForSession(wrongTeam, session)).toBe(false)
  })

  it('conserve le contrat exact d’un appel historique hors planning', () => {
    const historical = { ...session, id: 'historical', date: '2026-08-30', trainingSlotId: undefined }
    expect(isAttendanceDraftForSession(draft(historical), historical)).toBe(true)
    expect(isAttendanceDraftForSession(draft({ ...historical, trainingSlotId: 'slot-a' }), historical)).toBe(false)
  })
})

describe('action groupée explicite', () => {
  it('crée uniquement des observations de brouillon et ne valide pas la séance', () => {
    const players: AttendancePlayer[] = [
      { id: 'player-a', firstName: 'Alice', lastName: 'A', teamId: 'team-a' },
      { id: 'player-b', firstName: 'Arthur', lastName: 'B', teamId: 'team-a' },
    ]
    const records = setAttendanceDraftStatusForPlayers({
      session,
      players,
      records: [],
      status: 'present',
      source: 'coach',
      updatedAt: '2026-08-31T10:02:00Z',
    })

    expect(records).toHaveLength(2)
    expect(records.every((record) => record.status === 'present')).toBe(true)
    expect(records.every((record) => record.validatedByCoach !== true)).toBe(true)
    expect(session.locked).not.toBe(true)
  })
})
