import { describe, expect, it } from 'vitest'
import type { AttendancePlayer, AttendanceRecord, AttendanceSession, AttendanceStats } from '../../types/attendance'
import { buildAttendanceSummaryMarkdown, exportAttendanceCsv, exportAttendanceSessionCsv, exportAttendanceTeamCsv } from './attendanceExport'

const session: AttendanceSession = {
  id: 'session-1', teamId: 'team-1', title: 'Séance, terrain', date: '2026-08-27',
  type: 'entrainement', createdBy: 'coach-1', createdAt: '2026-08-27T10:00:00Z', updatedAt: '2026-08-27T10:00:00Z',
}
const players: AttendancePlayer[] = [
  { id: 'alice', firstName: 'Alice', lastName: 'D’Aubigné-Smith', teamId: 'team-1', teamName: 'Équipe "A"' },
  { id: 'arthur', firstName: 'Arthur', lastName: 'RLS, A', teamId: 'team-1', teamName: 'Équipe "A"' },
]
const records: AttendanceRecord[] = [{
  id: 'record-1', sessionId: session.id, teamId: session.teamId, playerId: 'alice',
  status: 'present', updatedAt: '2026-08-27T10:00:00Z',
}]

describe('exports attendance', () => {
  it('exporte chaque joueur attendu et distingue Non renseigné', () => {
    for (const output of [
      exportAttendanceCsv(records, players, [session]),
      exportAttendanceSessionCsv(session, records, players),
      buildAttendanceSummaryMarkdown(session, records, players),
    ]) {
      expect(output).toContain('Alice D’Aubigné-Smith')
      expect(output).toContain('Arthur RLS, A')
      expect(output).toContain('Non renseigné')
      expect(output).not.toContain('NaN')
      expect(output).not.toContain('Infinity')
    }
    expect(exportAttendanceCsv(records, players, [session])).toContain('Équipe ""A""')
  })

  it('exporte Non renseigné au lieu de 0 % sans aucun relevé', () => {
    const stat: AttendanceStats = {
      playerId: 'arthur', periodLabel: 'Août', totalSessions: 0, presentCount: 0,
      absentExcusedCount: 0, absentUnexcusedCount: 0, lateCount: 0, injuredCount: 0,
      attendanceRate: null, punctualityRate: 0, reliabilityScore: 0,
      recordedCount: 0, missingRecords: 1, completionRate: 0,
    }
    const output = exportAttendanceTeamCsv([stat], players)
    expect(output).toContain('Non renseigné')
    expect(output).not.toContain('"0%"')
  })
})
