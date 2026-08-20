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
})
