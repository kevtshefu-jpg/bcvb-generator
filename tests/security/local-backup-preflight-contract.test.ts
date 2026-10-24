// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('local backup preflight', () => {
  it('does not connect to a remote service or perform a backup', async () => {
    const source = await readFile(resolve(process.cwd(), 'ops/manual/local-backup-preflight-2026-10-21.sh'), 'utf8')
    const active = source.replace(/^\s*#[^\n]*$/gm, '')
    expect(active).toContain('uname -s')
    expect(active).toContain('fdesetup status')
    expect(active).toContain('supabase --version')
    expect(active).toContain('pg_dump')
    expect(active).not.toMatch(/\b(?:curl|wget|ssh|scp|rsync|pg_dump\s+--dbname|pg_restore\s+--dbname|supabase\s+db\s+dump|supabase\s+db\s+push|docker\s+exec|rm\s+-[rRfF]|chmod|chown|export\s+PGPASSWORD)\b/)
  })
  it('does not disclose private filenames, credentials, or database rows', async () => {
    const source = await readFile(resolve(process.cwd(), 'ops/manual/local-backup-preflight-2026-10-21.sh'), 'utf8')
    expect(source).toContain('NE PAS transmettre de dump')
    expect(source).not.toMatch(/\b(?:cat|head|tail|find|grep)\s+["'$]/)
    expect(source).toContain('du -sk')
  })
})
