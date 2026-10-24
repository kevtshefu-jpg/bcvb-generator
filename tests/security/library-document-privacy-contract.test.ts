// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('manual library document privacy contract', () => {
  it('does not log document payloads or full database rows in browser diagnostics', async () => {
    const source = await readFile(resolve(process.cwd(), 'src/services/manualGeneratedDocuments.ts'), 'utf8')
    expect(source).not.toMatch(/console\.(?:log|debug|info)\s*\(/)
    expect(source).toContain("content: cleanContent")
    expect(source).toContain(".from('library_documents')")
  })
})
