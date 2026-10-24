// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('isolated local restore readiness helper', () => {
  it('targets only the named isolated container and rejects network or port exposure', async () => {
    const source = await readFile(resolve(process.cwd(), 'ops/manual/local-restore-readiness-2026-10-21.sh'), 'utf8')
    expect(source).toContain('CONTAINER=bcvb-restore-test')
    expect(source).toContain('[ "$network" != none ]')
    expect(source).toContain('[ "$ports" !=')
    expect(source).toContain('[ "$status" != running ]')
    expect(source).toContain('docker exec -u postgres "$CONTAINER" psql')
  })

  it('contains no mutating database, Docker or backup operations', async () => {
    const source = await readFile(resolve(process.cwd(), 'ops/manual/local-restore-readiness-2026-10-21.sh'), 'utf8')
    const active = source.replace(/^\s*#[^\n]*$/gm, '')
    expect(active).not.toMatch(/\b(?:docker\s+(?:rm|run|stop|start|restart|volume\s+rm)|pg_restore\s+--|pg_dump\s+--|supabase\s+db\s+push)\b/i)
    expect(active).not.toMatch(/\b(?:drop|delete|insert|update|truncate|alter|create)\s+(?:table|from|into|public\.)/i)
    expect(source).toContain('ne prouve PAS')
  })
})
