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

  it('retourne des statuts typés sans exposer les erreurs internes', async () => {
    const source = await readFile(resolve(root, 'supabase/functions/admin-delete-profile/index.ts'), 'utf8')

    for (const status of [400, 401, 403, 404, 409, 500]) {
      expect(source).toContain(String(status))
    }
    expect(source).toContain("'DEPENDENCY_CONFLICT'")
    expect(source).toContain("'LAST_ADMIN_CONFLICT'")
    expect(source).toContain("'Une erreur interne est survenue.'")
    expect(source).not.toContain("error instanceof Error ? error.message")
  })

  it('délègue la suppression définitive à une transaction SQL restreinte', async () => {
    const source = await readFile(resolve(root, 'supabase/functions/admin-delete-profile/index.ts'), 'utf8')
    const [migration, grants] = await Promise.all([
      readFile(resolve(root, 'supabase/migrations/20260728140000_secure_atomic_profile_deletion.sql'), 'utf8'),
      readFile(resolve(root, 'supabase/migrations/20260728140100_restrict_atomic_profile_deletion.sql'), 'utf8'),
    ])

    expect(source).toContain("supabaseUser.rpc('delete_profile_atomically'")
    expect(source).not.toContain('auth.admin.deleteUser(')
    expect(migration).toContain('auth.uid() <> actor_profile_id')
    expect(migration).toContain('delete from auth.users where id = target_profile_id')
    expect(migration).toContain('delete from public.profiles where id = target_profile_id')
    expect(grants).toContain('grant execute on function public.delete_profile_atomically(uuid, uuid) to authenticated')
    expect(grants).toContain('revoke all on function public.delete_profile_atomically(uuid, uuid) from public, anon, service_role')
  })

  it('bloque les dépendances métier et journalise dans la même transaction', async () => {
    const migration = await readFile(
      resolve(root, 'supabase/migrations/20260728140000_secure_atomic_profile_deletion.sql'),
      'utf8',
    )

    for (const table of [
      'team_staff_assignments', 'teams', 'sessions', 'situations', 'players',
      'player_contacts', 'profile_requests', 'registration_requests',
      'roster_import_batches', 'session_imports', 'session_visibility_logs',
      'team_memberships', 'player_duplicate_candidates', 'admin_notifications',
    ]) {
      expect(migration).toContain(`public.${table}`)
    }
    expect(migration).toContain("raise sqlstate 'PT409'")
    expect(migration).toContain("'profile_deleted'")
    expect(migration.indexOf("'profile_deleted'")).toBeLessThan(migration.indexOf('delete from public.profiles'))
    expect(migration).toContain('get diagnostics deleted_profile_count = row_count')
    expect(migration).toContain('get diagnostics deleted_auth_count = row_count')
  })

  it('vérifie l’auto-action avant le dernier admin et distingue une erreur Auth indéterminée', async () => {
    const source = await readFile(resolve(root, 'supabase/functions/admin-delete-profile/index.ts'), 'utf8')

    expect(source.indexOf('callerProfile.id === targetProfile.id')).toBeLessThan(
      source.lastIndexOf('await assertNotLastActiveAdmin'),
    )
    expect(source).toContain("authError.code === 'user_not_found'")
    expect(source).toContain('(authError && !authUserIsAbsent)')
  })

  it('sérialise les suppressions, suspensions et rétrogradations d’administrateurs', async () => {
    const [deletion, mutations, grants] = await Promise.all([
      readFile(resolve(root, 'supabase/migrations/20260728140000_secure_atomic_profile_deletion.sql'), 'utf8'),
      readFile(resolve(root, 'supabase/migrations/20260728140200_serialize_active_admin_mutations.sql'), 'utf8'),
      readFile(resolve(root, 'supabase/migrations/20260728140300_restrict_active_admin_mutation_guard.sql'), 'utf8'),
    ])

    const lock = "hashtextextended('bcvb:active-admin-mutation', 0)"
    expect(deletion).toContain(lock)
    expect(mutations).toContain(lock)
    expect(mutations).toContain('removes_active_admin')
    expect(mutations).toContain("raise sqlstate 'PT409'")
    expect(grants).toContain('from public, anon, authenticated, service_role')
  })
})
