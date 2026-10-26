// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const sqlPath = resolve(process.cwd(), 'ops/manual/production-rls-hardening-2026-10-14.sql')
const servicePath = resolve(process.cwd(), 'src/services/manualGeneratedDocuments.ts')

function policyBody(sql: string, name: string, nextName: string) {
  const start = sql.indexOf(`create policy ${name}`)
  const end = sql.indexOf(`create policy ${nextName}`, start + 1)
  expect(start).toBeGreaterThanOrEqual(0)
  expect(end).toBeGreaterThan(start)
  return sql.slice(start, end)
}

describe('GO05 — soft deletion security contract (static, NOT an authorization test)', () => {
  it('requires deleted_at IS NULL before all authenticated access branches', async () => {
    const sql = await readFile(sqlPath, 'utf8')
    const body = policyBody(
      sql,
      'bcvb_rls_20261014_library_authenticated_read',
      'bcvb_rls_20261014_library_staff_insert',
    )
    const using = body.slice(body.indexOf('using (') + 'using ('.length)
    const firstOr = using.search(/\bor\b/i)
    expect(firstOr).toBeGreaterThan(0)
    expect(using.slice(0, firstOr)).toMatch(/is_active\s+is\s+true\s+and\s+deleted_at\s+is\s+null/i)
    expect(using).toContain("public.current_user_role() <> 'inactive'")
    expect(using).toContain('uploaded_by = auth.uid()')
    expect(using).toContain("status = 'published'")
    expect(using).toContain('audience')
  })

  it('also excludes deleted records from public reads', async () => {
    const sql = await readFile(sqlPath, 'utf8')
    const body = policyBody(
      sql,
      'bcvb_rls_20261014_library_public_read',
      'bcvb_rls_20261014_library_authenticated_read',
    )
    expect(body).toMatch(/is_active\s+is\s+true\s+and\s+deleted_at\s+is\s+null/i)
    expect(body).toContain("status = 'published' and audience = 'public'")
  })

  it('does not rewrite historic deleted_at values as a preflight workaround', async () => {
    const sql = await readFile(sqlPath, 'utf8')
    expect(sql).not.toMatch(/update\s+(?:public\.)?library_documents\s+set\s+deleted_at\s*=\s*null/i)
    expect(sql).not.toContain('GO05: documents actifs avec deleted_at non nul')
    expect(sql).toContain('begin;')
    expect(sql.trimEnd()).toMatch(/commit;$/)
  })

  it('documents the phantom Storage path risk without assuming upload occurred', async () => {
    const service = await readFile(servicePath, 'utf8')
    expect(service).toContain("content: cleanContent")
    expect(service).toContain("bucket_name: 'bcvb-library'")
    expect(service).toContain('storage_path: uniquePath')
    expect(service).not.toMatch(/\.storage\.from\s*\(/)
    // This assertion describes CURRENT behavior; it is not a desired long-term contract.
  })
})
