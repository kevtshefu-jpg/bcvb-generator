import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { AttendanceRecord, AttendanceSession } from '../../types/attendance'
import {
  buildAttendanceAlerts,
  computePlayerAttendanceStats,
  computeSessionStats,
  computeTeamAttendanceStats,
} from '../../lib/attendance/attendanceStats'
import { computeAttendanceQualityScore } from '../../lib/attendance/attendanceScoring'

describe('contrats GO-02D du service présences', () => {
  it('utilise Supabase comme source de vérité', async () => {
    const source = await readFile(
      resolve(process.cwd(), 'src/features/attendance/attendanceService.ts'),
      'utf8',
    )

    expect(source).toContain("from('team_memberships')")
    expect(source).toContain('player:players(')
    expect(source).toContain("from('attendance_sessions')")
    expect(source).toContain("'read_attendance_records_versioned'")
    expect(source).not.toContain("'read_attendance_record_versions'")
    expect(source).not.toMatch(/localStorage|sessionStorage|mock/i)
  })

  it('ne crée pas automatiquement des joueurs présents', async () => {
    const source = await readFile(
      resolve(process.cwd(), 'src/features/attendance/attendanceService.ts'),
      'utf8',
    )

    expect(source).not.toMatch(/status:\s*['"]present['"].*player/si)
  })

  it('rattache les joueurs à une équipe via team_memberships', async () => {
    const source = await readFile(
      resolve(process.cwd(), 'src/features/attendance/attendanceService.ts'),
      'utf8',
    )

    expect(source).toContain("from('team_memberships')")
    expect(source).toContain(".eq('team_id', teamId)")
  })

  it('confirme les mutations côté serveur', async () => {
    const source = await readFile(
      resolve(process.cwd(), 'src/features/attendance/attendanceService.ts'),
      'utf8',
    )

    expect(source).toContain("supabase.rpc(")
    expect(source).toContain("'save_attendance_record'")
    expect(source).toContain('expected_version: input.version ?? null')
    expect(source).toContain('version: Number(saveResult?.version)')
    expect(source).toContain("'validate_attendance_session'")
    expect(source).toContain("data?.session_id !== sessionId")
    expect(source).toContain("validated_by_coach: false")
    expect(source).not.toContain("Boolean(input.validatedByCoach)")
  })

  it('préserve le brouillon et exige une décision explicite lors d’un conflit concurrent', async () => {
    const page = await readFile(
      resolve(process.cwd(), 'src/components/attendance/AttendancePage.tsx'),
      'utf8',
    )
    const conflictHandler = page.slice(
      page.indexOf('} catch (error) {', page.indexOf('async function persistCall')),
      page.indexOf('} finally {', page.indexOf('async function persistCall')),
    )

    expect(page).toContain('error instanceof AttendanceConflictError')
    expect(conflictHandler).toContain('persistDraft(session, records)')
    expect(conflictHandler).toContain('setDraftDirty(true)')
    expect(conflictHandler).toContain('setLastSavedAt("")')
    expect(conflictHandler).toContain('await loadAttendanceRecords(session.id)')
    expect(page).toContain('Recharger la version serveur')
    expect(page).toContain('Vos modifications locales ont été conservées')
  })

  it('raccorde les mutations de la page sans fabriquer de présences', async () => {
    const [page, callSheet] = await Promise.all([
      readFile(
        resolve(process.cwd(), 'src/components/attendance/AttendancePage.tsx'),
        'utf8',
      ),
      readFile(
        resolve(process.cwd(), 'src/components/attendance/AttendanceCallSheet.tsx'),
        'utf8',
      ),
    ])

    expect(page).toContain('saveAttendanceRecord')
    expect(page).toContain('validateAttendanceSession')
    expect(page).toContain('createAttendanceSession')
    expect(page).not.toContain('validatedByCoach: true')
    expect(page).not.toContain('locked: true')
    expect(page).not.toMatch(/index % 5|index % 6/)
    expect(page).not.toMatch(/Noah|Lina|Adam|Sofia|Ilyes/)
    expect(page).not.toMatch(/status:\s*["']present["']/)
    expect(callSheet).toContain('Brouillon local actif')
  })

  it('affiche les métadonnées de séance sans édition locale', async () => {
    const selector = await readFile(
      resolve(process.cwd(), 'src/components/attendance/AttendanceSessionSelector.tsx'),
      'utf8',
    )

    expect(selector).not.toMatch(
      /onChange[^\n]*(?:session\.(?:date|type|title|startTime|location)|(?:date|type|title|startTime|location):)/,
    )
    expect(selector).not.toContain('onChange: (session: AttendanceSession) => void')
    expect(selector).toContain('session.startTime || "Non renseigné"')
    expect(selector).toContain('session.location || "Non renseigné"')
  })

  it('préserve le brouillon avant un changement réel d’équipe ou de séance', async () => {
    const page = await readFile(
      resolve(process.cwd(), 'src/components/attendance/AttendancePage.tsx'),
      'utf8',
    )
    const changeTeam = page.slice(
      page.indexOf('async function changeTeam'),
      page.indexOf('async function changeAttendanceSession'),
    )
    const changeAttendanceSession = page.slice(
      page.indexOf('async function changeAttendanceSession'),
      page.indexOf('function resumeDraft'),
    )

    expect(changeTeam).toContain('if (teamId === selectedTeamId) return;')
    expect(changeTeam).toMatch(/if \(draftDirty\) persistDraft\(\);/)
    expect(changeAttendanceSession).toContain(
      'if (sessionId === session?.id) return;',
    )
    expect(changeAttendanceSession).toMatch(
      /if \(draftDirty\) persistDraft\(\);/,
    )
    expect(changeAttendanceSession.indexOf('persistDraft()')).toBeLessThan(
      changeAttendanceSession.indexOf('setSession(selectedSession)'),
    )
    expect(changeAttendanceSession).not.toMatch(
      /new\s+AttendanceRecord|:\s*AttendanceRecord(?:\[\])?\s*=|status:\s*["']present["']/,
    )
    expect(page).not.toMatch(/locked:\s*true|validatedByCoach:\s*true/)
  })

  it('sépare absence de relevé, présence sportive et complétude', () => {
    const session: AttendanceSession = {
      id: 'session-a',
      teamId: 'team-a',
      title: 'Séance A',
      date: '2026-08-27',
      type: 'entrainement',
      createdBy: 'coach-a',
      createdAt: '2026-08-27T10:00:00.000Z',
      updatedAt: '2026-08-27T10:00:00.000Z',
    }
    const alicePresent: AttendanceRecord = {
      id: 'record-alice',
      sessionId: session.id,
      teamId: session.teamId,
      playerId: 'alice',
      status: 'present',
      updatedAt: '2026-08-27T10:00:00.000Z',
    }
    const records = [alicePresent]

    const sessionStats = computeSessionStats(records, 2)
    const teamStats = computeTeamAttendanceStats({
      teamId: session.teamId,
      records,
      playerCount: 2,
      totalSessions: 1,
      periodLabel: session.date,
    })
    const arthurStats = computePlayerAttendanceStats(records, [session], 'arthur')
    const quality = computeAttendanceQualityScore([session], records, 2)

    expect(sessionStats).toMatchObject({
      presentCount: 1,
      absentExcusedCount: 0,
      absentUnexcusedCount: 0,
      attendanceRate: 100,
      recordedCount: 1,
      missingRecords: 1,
      completionRate: 50,
    })
    expect(teamStats.attendanceRate).toBe(sessionStats.attendanceRate)
    expect(teamStats).toMatchObject({ recordedCount: 1, missingRecords: 1, completionRate: 50 })
    expect(arthurStats).toMatchObject({
      totalSessions: 0,
      presentCount: 0,
      absentExcusedCount: 0,
      absentUnexcusedCount: 0,
      recordedCount: 0,
      missingRecords: 1,
    })
    expect(buildAttendanceAlerts(arthurStats)).toEqual([])
    expect(quality).toMatchObject({ score: 50, missingRecords: 1, completionRate: 50 })
    expect(records).toHaveLength(1)
  })

  it('calcule un appel complet uniquement à partir des relevés réels', () => {
    const records: AttendanceRecord[] = [
      {
        id: 'record-alice',
        sessionId: 'session-a',
        teamId: 'team-a',
        playerId: 'alice',
        status: 'present',
        updatedAt: '2026-08-27T10:00:00.000Z',
      },
      {
        id: 'record-arthur',
        sessionId: 'session-a',
        teamId: 'team-a',
        playerId: 'arthur',
        status: 'absent_excused',
        reason: 'Maladie',
        updatedAt: '2026-08-27T10:00:00.000Z',
      },
    ]

    const sessionStats = computeSessionStats(records, 2)
    const teamStats = computeTeamAttendanceStats({
      teamId: 'team-a',
      records,
      playerCount: 2,
      totalSessions: 1,
      periodLabel: '2026-08-27',
    })

    expect(sessionStats).toMatchObject({
      attendanceRate: 50,
      recordedCount: 2,
      missingRecords: 0,
      completionRate: 100,
    })
    expect(teamStats.attendanceRate).toBe(sessionStats.attendanceRate)
    expect(teamStats).toMatchObject({ recordedCount: 2, missingRecords: 0, completionRate: 100 })
  })

  it('ne neutralise plus les protections lorsqu’un ancien brouillon est détecté', async () => {
    const page = await readFile(
      resolve(process.cwd(), 'src/components/attendance/AttendancePage.tsx'),
      'utf8',
    )

    expect(page).toContain('function discardStoredDraft()')
    expect(page).toContain('window.localStorage.removeItem(currentDraftKey)')
    expect(page).toContain('Ignorer ce brouillon')
    expect(page).not.toContain('if (!session || storedDraft || !draftDirty)')
    expect(page).not.toContain('if (!storedDraft && draftDirty)')
    expect(page).toContain('if (!session || !draftDirty) return undefined;')
    expect(page).toContain('if (draftDirty) persistDraft();')
    expect(page).toContain('setDraftDirty(true);')
    expect(page).toContain('`bcvb.attendance.draft.${session.teamId}.${session.date}.${session.id}`')
  })

  it('retire les fausses mutations parent référent', async () => {
    const panel = await readFile(
      resolve(process.cwd(), 'src/components/attendance/ParentReferentAttendancePanel.tsx'),
      'utf8',
    )

    expect(panel).toContain('Consultation de l’appel')
    expect(panel).not.toMatch(/onRecordChange|onLogisticsNoteChange|toggleConfirmation|signalStatus/)
    expect(panel).not.toMatch(/validatedByCoach|status:\s*["']present["']/)
  })
})
