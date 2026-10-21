// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('direct production Postgres authentication preflight', () => {
  it('requires server-verified TLS and an interactive password, with no secret in args', async () => {
    const source = await readFile(resolve(process.cwd(), 'ops/manual/local-direct-auth-readonly-2026-10-21.sh'), 'utf8')
    expect(source).toContain('PGSSLMODE=verify-full')
    expect(source).toContain('PGSSLROOTCERT="$CERT"')
    expect(source).toContain('PGPASSFILE=/dev/null')
    expect(source).toContain('psql -X -W -v ON_ERROR_STOP=1')
    expect(source).toContain('PGOPTIONS=')
    expect(source).toContain('default_transaction_read_only=on')
    expect(source).toContain('BEGIN READ ONLY;')
    expect(source).toContain('COMMIT;')
    expect(source).not.toMatch(/\b(?:PGPASSWORD|DATABASE_URL|SUPABASE_SERVICE_ROLE_KEY)\b/)
  })
  it('performs only aggregate privilege inspection without exporting or modifying data', async () => {
    const source = await readFile(resolve(process.cwd(), 'ops/manual/local-direct-auth-readonly-2026-10-21.sh'), 'utf8')
    const sql = source.split("<<'SQL'")[1]?.split('\nSQL\n')[0] ?? ''
    const statements = sql.split(';').map((x) => x.trim()).filter(Boolean)
    expect(statements[0]).toBe('BEGIN READ ONLY')
    expect(statements.at(-1)).toBe('COMMIT')
    expect(statements.slice(1, -1)).toHaveLength(3)
    for (const statement of statements.slice(1, -1)) expect(statement).toMatch(/^SELECT\b/i)
    expect(sql).not.toMatch(/\bSELECT\s+\*/i)
    expect(sql).not.toMatch(/\b(?:COPY|INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE)\b/i)
    expect(source).not.toMatch(/\b(?:pg_dump|pg_restore|supabase\s+db\s+push|docker\s+exec|curl|wget)\b/)
  })
})
