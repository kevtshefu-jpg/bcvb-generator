import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

describe('contrats GO-02D du service présences', () => {
  it('utilise Supabase comme source de vérité', async () => {
    const source = await readFile(
      resolve(process.cwd(), 'src/features/attendance/attendanceService.ts'),
      'utf8',
    )

    expect(source).toContain("from('team_memberships')")
    expect(source).toContain('player:players(')
    expect(source).toContain("from('attendance_sessions')")
    expect(source).toContain("from('attendance_records')")
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

    expect(source).toContain('.single()')
    expect(source).toContain("supabase.rpc(")
    expect(source).toContain("'validate_attendance_session'")
    expect(source).toContain("data?.session_id !== sessionId")
    expect(source).toContain("validated_by_coach: false")
    expect(source).not.toContain("Boolean(input.validatedByCoach)")
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
})
