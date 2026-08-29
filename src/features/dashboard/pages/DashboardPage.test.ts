import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(process.cwd(), 'src/features/dashboard/pages/DashboardPage.tsx'), 'utf8')

describe('DashboardPage pilot integrity', () => {
  it('does not expose invented operational metrics or fake work history', () => {
    for (const inventedValue of ['128', '86%', '74%', 'Référentiel U13 - Défendre fort', 'U15 - Transition offensive']) {
      expect(source).not.toContain(inventedValue)
    }
    expect(source).toContain('Aucun indicateur consolidé n’est disponible pour ce profil.')
    expect(source).not.toContain('to="/seances"')
    expect(source).not.toContain('to="/generateur"')
  })
})
