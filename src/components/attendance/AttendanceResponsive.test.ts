// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('grille responsive des métriques Attendance', () => {
  it('reste sur deux colonnes de 341 à 760 px et passe à une colonne à 340 px', async () => {
    const css = await readFile(resolve(process.cwd(), 'src/styles/attendance.css'), 'utf8')
    const mobileRule = css.slice(css.indexOf('@media (max-width: 760px)'), css.indexOf('@media (max-width: 340px)'))
    const narrowRule = css.slice(css.indexOf('@media (max-width: 340px)'), css.indexOf('@media (max-width: 430px)'))

    expect(mobileRule).not.toMatch(/\.attendance-stat-grid[\s\S]*?grid-template-columns:\s*1fr/)
    expect(narrowRule).toMatch(/\.attendance-stat-grid\s*\{[\s\S]*?grid-template-columns:\s*1fr/)
  })
})
