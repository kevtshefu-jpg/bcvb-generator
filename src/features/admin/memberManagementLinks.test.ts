// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()

async function source(path: string) {
  return readFile(resolve(root, path), 'utf8')
}

describe('points d’entrée de la gestion des membres', () => {
  it.each([
    'src/features/admin/pages/AdminPage.tsx',
    'src/features/dashboard/pages/DashboardPage.tsx',
    'src/components/admin/AdminSettingsPage.tsx',
  ])('%s utilise la route canonique partagée', async (file) => {
    expect(await source(file)).toContain('MEMBER_MANAGEMENT_PATH')
  })

  it('alimente les navigations desktop et mobile avec une seule entrée canonique', async () => {
    const categories = await source('src/config/siteCategories.js')
    const mobileNavigation = await source('src/components/navigation/MobileNavigation.tsx')

    expect(categories.match(/path: '\/admin\/membres'/g)).toHaveLength(1)
    expect(categories).toContain("roles: ['admin']")
    expect(mobileNavigation).not.toContain("id: 'mobile-admin-members'")
    expect(mobileNavigation).toContain('const navigationItems = NAV_ITEMS')
  })

  it('route les alias vers la page canonique et charge directement AdminProfilesPage', async () => {
    const router = await source('src/app/router.tsx')

    expect(router).toContain("allowedRoles={['admin']}")
    expect(router).toContain('path: MEMBER_MANAGEMENT_ROUTE')
    expect(router).toContain('element: <AdminProfilesPage />')
    expect(router).toContain('<Navigate to={MEMBER_MANAGEMENT_PATH} replace />')
    expect(router).not.toContain('AdminMembersPage')
  })
})
