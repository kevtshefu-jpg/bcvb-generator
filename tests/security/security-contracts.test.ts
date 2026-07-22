// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const migrationPath = resolve(root, 'supabase/migrations/20260719090000_harden_role_and_team_rls.sql')
const legacyPolicyMigrationPath = resolve(root, 'supabase/migrations/20260719085900_replace_legacy_ai_email_policies.sql')
const sensitiveFunctions = [
  'admin-delete-profile',
  'create-approved-user',
  'generate-ai-document',
  'notify-admin-event',
  'notify-registration-created',
  'send-bcvb-email',
  'ai-openai',
  'ai-anthropic',
]

describe('contrats de sécurité RLS', () => {
  it('remplace les policies historiques IA/email sans condition globale true', async () => {
    const [legacySql, hardeningSql] = await Promise.all([
      readFile(legacyPolicyMigrationPath, 'utf8'),
      readFile(migrationPath, 'utf8'),
    ])
    for (const table of ['ai_expert_modes', 'document_ai_results', 'email_events']) {
      expect(legacySql).toContain(table)
      expect(hardeningSql).toContain(`'${table}'`)
    }
    expect(legacySql).not.toMatch(/using\s*\(\s*true\s*\)/i)
    expect(legacySql).not.toMatch(/with\s+check\s*\(\s*true\s*\)/i)
    expect(hardeningSql).toContain('ai_expert_modes_admin_read')
    expect(hardeningSql).toContain('document_ai_results_owner_or_admin_read')
    expect(hardeningSql).toContain('email_events_admin_read')
    expect(hardeningSql).not.toMatch(/create policy (?:ai_expert_modes|document_ai_results|email_events)[\s\S]{0,160}for (?:insert|update|delete|all) to authenticated/i)
  })

  it('détermine le propriétaire des résultats IA par introspection et retombe en admin only', async () => {
    const sql = await readFile(migrationPath, 'utf8')
    expect(sql).toContain("c.column_name in ('owner_id', 'user_id', 'created_by', 'requested_by')")
    expect(sql).toContain("c.table_name = 'library_documents'")
    expect(sql).toContain('document_ai_results sans propriétaire UUID exploitable : lecture admin uniquement')
    expect(sql).toContain('public.is_current_user_admin() or')
  })

  it('ne crée aucune policy globalement permissive', async () => {
    const sql = await readFile(migrationPath, 'utf8')
    expect(sql).not.toMatch(/using\s*\(\s*true\s*\)/i)
    expect(sql).not.toMatch(/with\s+check\s*\(\s*true\s*\)/i)
    expect(sql).toContain('Policies globalement permissives restantes')
  })

  it('fonde le rôle actif exclusivement sur auth.uid et un profil actif', async () => {
    const sql = await readFile(migrationPath, 'utf8')
    const roleFunction = sql.match(/create or replace function public\.current_user_role\(\)[\s\S]*?\$\$;/i)?.[0] || ''
    expect(roleFunction).toContain('where p.id = auth.uid()')
    expect(roleFunction).toContain('p.is_active is true')
    expect(roleFunction).toContain("profile_status, 'active'")
    expect(roleFunction).not.toMatch(/current_setting\s*\(/i)
  })

  it('protège les fonctions security definer par search_path et propriétaire', async () => {
    const sql = await readFile(migrationPath, 'utf8')
    const definerCount = (sql.match(/^\s*security definer\s*$/gim) || []).length
    const searchPathCount = (sql.match(/set search_path = public, pg_temp/gi) || []).length
    const ownerCount = (sql.match(/owner to postgres/gi) || []).length
    expect(definerCount).toBeGreaterThanOrEqual(8)
    expect(searchPathCount).toBe(definerCount)
    expect(ownerCount).toBe(definerCount)
  })

  it('isole les ressources sportives par équipe', async () => {
    const sql = await readFile(migrationPath, 'utf8')
    expect(sql).toContain('public.can_access_team(team_id)')
    expect(sql).toContain('where tm.player_id = players.id and public.can_access_team(tm.team_id)')
    expect(sql).toContain('add column if not exists team_id uuid null references public.teams(id)')
    expect(sql).toContain("current_user_role() not in ('coach', 'team_staff', 'parent_referent')")
  })

  it('bloque les modifications de droits sur son propre profil', async () => {
    const sql = await readFile(migrationPath, 'utf8')
    for (const field of ['new.role', 'new.is_active', 'new.profile_status', 'new.category_id']) {
      expect(sql).toContain(field)
    }
    expect(sql).toContain("Modification des droits du profil interdite")
  })
})

describe('contrats des Edge Functions sensibles', () => {
  for (const functionName of sensitiveFunctions) {
    it(`${functionName} vérifie le JWT, le profil actif et le statut`, async () => {
      const source = await readFile(resolve(root, `supabase/functions/${functionName}/index.ts`), 'utf8')
      expect(source).toMatch(/auth\.getUser\(/)
      expect(source).toContain('profile_status')
      expect(source).toMatch(/is_active/)
      expect(source).toMatch(/role/)
    })
  }

  it('notify-registration-created rattache et consomme une vraie demande', async () => {
    const source = await readFile(resolve(root, 'supabase/functions/notify-registration-created/index.ts'), 'utf8')
    expect(source).toContain(".from('registration_requests')")
    expect(source).toContain(".eq('status', 'pending')")
    expect(source).toContain(".is('notification_sent_at', null)")
    expect(source).toContain('escapeHtml')
  })
})

describe('contrat du seed RLS', () => {
  it('reste idempotent et ne contient aucune clé de service', async () => {
    const source = await readFile(resolve(root, 'scripts/create-test-users.mjs'), 'utf8')
    expect(source).toContain('.upsert(')
    expect(source).toContain('updateUserById')
    expect(source).toContain('createUser')
    expect(source).not.toMatch(/service_role\s*[:=]\s*['"][A-Za-z0-9._-]+/i)
  })

  it('refuse une cible non explicitement confirmée', async () => {
    const source = await readFile(resolve(root, 'scripts/rls-test-config.mjs'), 'utf8')
    expect(source).toContain('RLS_TEST_ENVIRONMENT')
    expect(source).toContain('RLS_TEST_CONFIRM_PROJECT_REF')
    expect(source).toContain('RLS_TEST_PRODUCTION_PROJECT_REF')
    expect(source).toContain('I_UNDERSTAND_THIS_WILL_MUTATE_PRODUCTION')
  })
})
