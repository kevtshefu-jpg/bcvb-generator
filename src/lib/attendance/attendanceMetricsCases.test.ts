import { describe, expect, it } from 'vitest'
import type { AttendanceRecord, AttendanceSession, AttendanceStatus } from '../../types/attendance'
import { computeAttendanceQualityScore } from './attendanceScoring'
import { buildAttendanceAlerts, buildAttendanceDashboardData, computeSessionStats } from './attendanceStats'

const session = (locked = false): AttendanceSession => ({
  id: 'session-1', teamId: 'team-1', title: 'Séance', date: '2026-08-27',
  type: 'entrainement', createdBy: 'coach-1', locked,
  createdAt: '2026-08-27T10:00:00Z', updatedAt: '2026-08-27T10:00:00Z',
})

function record(playerId: string, status: AttendanceStatus): AttendanceRecord {
  return {
    id: `record-${playerId}`, sessionId: 'session-1', teamId: 'team-1', playerId,
    status, reason: status === 'present' ? undefined : 'Motif réel',
    delayMinutes: status === 'late' ? 5 : undefined,
    updatedAt: '2026-08-27T10:00:00Z',
  }
}

function metrics(records: AttendanceRecord[], expected = 2, locked = false) {
  const stats = computeSessionStats(records, expected)
  return {
    stats,
    quality: computeAttendanceQualityScore([session(locked)], records, expected),
    alerts: buildAttendanceAlerts(stats),
  }
}

describe('matrice métriques GO-02E.9', () => {
  it.each([
    ['0 relevé / 2', [], 2, null, 0, 2, 0, 0],
    ['tous absents', [record('alice', 'absent_excused'), record('arthur', 'absent_unexcused')], 2, 0, 100, 0, 100, 1],
    ['retard seul', [record('alice', 'late')], 1, 0, 100, 0, 100, 1],
    ['blessé seul', [record('alice', 'injured')], 1, 0, 100, 0, 100, 1],
    ['1 présent + 1 non renseigné', [record('alice', 'present')], 2, 100, 50, 1, 50, 0],
    ['1 présent + 1 absent réel', [record('alice', 'present'), record('arthur', 'absent_excused')], 2, 50, 100, 0, 100, 1],
    ['séance complète', [record('alice', 'present'), record('arthur', 'present')], 2, 100, 100, 0, 100, 0],
  ])('%s', (_label, records, expected, rate, completion, missing, quality, alertCount) => {
    const result = metrics(records as AttendanceRecord[], expected as number)
    expect(result.stats).toMatchObject({ attendanceRate: rate, completionRate: completion, missingRecords: missing })
    expect(result.quality.completionRate).toBe(completion)
    expect(result.quality.score).toBe(quality)
    expect(result.alerts).toHaveLength(alertCount as number)
    expect(result.quality.score).toBeGreaterThanOrEqual(0)
    expect(result.quality.score).toBeLessThanOrEqual(100)
    if (result.stats.attendanceRate !== null) {
      expect(Number.isFinite(result.stats.attendanceRate)).toBe(true)
    }
  })

  it('une séance verrouillée conserve exactement les mêmes métriques', () => {
    const records = [record('alice', 'present')]
    expect(metrics(records, 2, true)).toEqual(metrics(records, 2, false))
  })

  it('un joueur non renseigné ne produit aucune alerte', () => {
    expect(metrics([], 2).alerts).toEqual([])
  })

  it('préserve le taux indisponible dans les synthèses dashboard', () => {
    const dashboard = buildAttendanceDashboardData(
      [],
      [session()],
      [{ id: 'team-1', name: 'Équipe', category: 'Senior' }],
      [{ id: 'alice', firstName: 'Alice', lastName: 'A', teamId: 'team-1' }],
    )

    expect(dashboard.globalAttendanceRate).toBeNull()
    expect(dashboard.teamsAttendanceRanking[0]?.attendanceRate).toBeNull()
  })

  it('distingue une absence d’observation de sept absences observées', () => {
    const unobserved = metrics([], 7)
    const observedAbsences = metrics(
      Array.from({ length: 7 }, (_, index) => record(`player-${index}`, 'absent_excused')),
      7,
    )

    expect(unobserved.stats).toMatchObject({
      attendanceRate: null,
      recordedCount: 0,
      missingRecords: 7,
      completionRate: 0,
    })
    expect(unobserved.alerts).toEqual([])
    expect(observedAbsences.stats).toMatchObject({
      attendanceRate: 0,
      recordedCount: 7,
      missingRecords: 0,
      completionRate: 100,
    })
  })

  it.each([
    ['1 présent sur 1 relevé / 7 attendus', [record('alice', 'present')], 100, 14.3],
    [
      '5 présents et 2 absents observés',
      [
        ...Array.from({ length: 5 }, (_, index) => record(`present-${index}`, 'present')),
        record('absent-1', 'absent_excused'),
        record('absent-2', 'absent_unexcused'),
      ],
      71.4,
      100,
    ],
  ])('%s', (_label, records, attendanceRate, completionRate) => {
    expect(computeSessionStats(records as AttendanceRecord[], 7)).toMatchObject({
      attendanceRate,
      completionRate,
    })
  })
})
