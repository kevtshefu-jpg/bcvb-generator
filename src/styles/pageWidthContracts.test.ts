// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()

async function source(path: string) {
  return readFile(resolve(root, path), 'utf8')
}

describe('contrats de largeur des pages', () => {
  it('plafonne et centre les variantes sans dépendre de 100vw', async () => {
    const css = await source('src/styles/premium-ui-system.css')

    expect(css).toContain('--bcvb-page-max: 1180px')
    expect(css).toContain('--bcvb-page-reading-max: 1040px')
    expect(css).toContain('--bcvb-page-wide-max: 1320px')
    expect(css).toContain('margin-inline: auto')
    expect(css).not.toMatch(/\.bcvb-page-shell[\s\S]{0,260}100vw/)
  })

  it('applique une largeur maîtrisée aux pages GO LIVE prioritaires', async () => {
    const files = [
      'src/features/admin/pages/AdminPage.tsx',
      'src/features/admin/pages/AdminProfilesPage.tsx',
      'src/features/registration/pages/AdminRegistrationRequestsPage.tsx',
      'src/features/admin/pages/AdminProfileRequestsPage.tsx',
      'src/features/dashboard/pages/DashboardPage.tsx',
      'src/components/teams/TeamsPage.tsx',
      'src/components/planning/PlanningPage.tsx',
      'src/features/library/pages/LibraryPage.tsx',
    ]

    for (const file of files) {
      expect(await source(file), file).toMatch(/<PageShell|bcvb-page-shell/)
    }
  })
})
