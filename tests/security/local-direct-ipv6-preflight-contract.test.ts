// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('direct IPv6 PostgreSQL network preflight', () => {
  it('uses IPv6 TCP only, without authenticating or sending SQL', async () => {
    const source = await readFile(resolve(process.cwd(), 'ops/manual/local-direct-ipv6-preflight-2026-10-21.sh'), 'utf8')
    expect(source).toContain('socket.AF_INET6')
    expect(source).toContain('socket.SOCK_STREAM')
    expect(source).toContain('connection.connect(address)')
    expect(source).toContain('connection.settimeout(4.0)')
    expect(source).toContain('db.leziahqmqyuewpzjmzxf.supabase.co')
    expect(source).toContain('port = 5432')
    expect(source).not.toContain('connection.send')
    expect(source).not.toContain('connection.recv')
    const active = source.replace(/^\s*#[^\n]*$/gm, '')
    expect(active).not.toMatch(/\b(?:psql|pg_dump|pg_restore|supabase\s+db|curl|wget|ssh|docker\s+exec)\b/)
    expect(active).not.toMatch(/\b(?:PGPASSWORD|DATABASE_URL|SUPABASE_SERVICE_ROLE_KEY|SECRET_KEY)\b/)
  })
})
