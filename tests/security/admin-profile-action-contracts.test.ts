// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()

describe('contrat serveur des rôles et statuts', () => {
  it('réserve les mutations à un administrateur actif strict', async () => {
    const source = await readFile(resolve(root, 'supabase/functions/admin-delete-profile/index.ts'), 'utf8')

    expect(source).toContain("normalizeRole(value) === 'admin'")
    expect(source).toContain("profile.profile_status !== 'active'")
    expect(source).toContain('!isStrictAdminRole(profile.role)')
  })

  it('valide le rôle côté serveur et maintient les deux champs de statut', async () => {
    const source = await readFile(resolve(root, 'supabase/functions/admin-delete-profile/index.ts'), 'utf8')

    expect(source).toContain("action === 'update_role' && !isAdminAssignableRole(requestedRole)")
    expect(source).toContain("profile_status: isActive ? 'active' : 'suspended'")
    expect(source).toContain(".update({ role, updated_at: new Date().toISOString() })")
    expect(source).not.toContain('.update({ is_active: isActive })')
  })

  it('protège l’auto-modification et le dernier administrateur actif', async () => {
    const source = await readFile(resolve(root, 'supabase/functions/admin-delete-profile/index.ts'), 'utf8')

    expect(source).toContain('callerProfile.id === targetProfile.id')
    expect(source).toContain(".eq('role', 'admin')")
    expect(source).toContain(".eq('profile_status', 'active')")
    expect(source).toContain('assertNotLastActiveAdmin')
  })
})
