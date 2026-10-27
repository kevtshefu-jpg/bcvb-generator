// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const auditPath = resolve(process.cwd(), 'ops/manual/production-rls-storage-readonly-audit-2026-10-21.sql')

describe('production RLS/Storage aggregate audit — read-only contract', () => {
  it('contains exactly four SELECT statements and no mutating SQL statement', async () => {
    const source = await readFile(auditPath, 'utf8')
    const sql = source.replace(/^\s*--[^\n]*$/gm, '').trim()
    const statements = sql.split(';').map((statement) => statement.trim()).filter(Boolean)
    expect(statements).toHaveLength(4)
    for (const statement of statements) {
      expect(statement).toMatch(/^select\b/i)
      expect(statement).not.toMatch(/\b(?:pg_sleep|dblink_exec|lo_export)\s*\(/i)
    }
    expect(source).toContain('This script is NOT a remediation, backup, or migration.')
  })

  it('reports only aggregate document and Storage facts without exposing object paths', async () => {
    const source = await readFile(auditPath, 'utf8')
    for (const required of [
      'pg_policies', 'relrowsecurity', 'has_table_privilege',
      'documents_active_and_soft_deleted', 'published_but_soft_deleted',
      'objects_without_owner', 'objects_with_document_row',
      'objects_with_non_deleted_document', 'documents_using_lowercase_bucket',
      'authenticated_bucket_only_select_policies',
    ]) expect(source).toContain(required)

    const sql = source.replace(/^\s*--[^\n]*$/gm, '')
    expect(sql).not.toMatch(/\bselect\s+\*/i)
    expect(sql).not.toMatch(/\b(?:o\.name|d\.storage_path|d\.title|o\.metadata)\s+as\s+/i)
  })
})
