// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationPath = resolve(
  process.cwd(),
  'supabase/migrations/20260903100000_player_access_security_remediation.sql',
)

describe('contrat de sécurité player/contact courant', () => {
  it('conditionne les accès équipe à un membership actif sans saison globale', async () => {
    const sql = await readFile(migrationPath, 'utf8')
    const helper = sql.match(/create or replace function public\.can_access_current_player[\s\S]*?\$\$;/i)?.[0] || ''

    expect(helper).toContain("tm.status = 'active'")
    expect(helper).toContain('public.can_access_team(tm.team_id)')
    expect(helper).toContain('tm.player_id = target_player_id')
    expect(helper).not.toMatch(/current_season|extract\s*\(\s*year/i)
  })

  it('retire les écritures player client et tout accès brut aux contacts', async () => {
    const sql = await readFile(migrationPath, 'utf8')

    expect(sql).toContain('revoke all privileges on table public.players from authenticated')
    expect(sql).toContain('grant select on table public.players to authenticated')
    expect(sql).toContain('revoke all privileges on table public.player_contacts from authenticated')
    expect(sql).not.toMatch(/grant\s+(?:insert|update|delete).*public\.(?:players|player_contacts).*authenticated/i)
  })

  it('réserve les contacts à une RPC Admin/RT fail-closed', async () => {
    const sql = await readFile(migrationPath, 'utf8')
    const rpc = sql.match(/create or replace function public\.read_player_contacts_admin[\s\S]*?\$\$;/i)?.[0] || ''

    expect(rpc).toContain('auth.uid() is null')
    expect(rpc).toContain('not public.is_current_user_admin()')
    expect(rpc).toContain("raise exception 'Accès administratif requis.'")
    expect(rpc).toContain('if target_player_id is null then')
    expect(rpc).toContain("raise exception 'Identifiant joueur requis.' using errcode = '22023'")
    expect(rpc).toContain('where pc.player_id = target_player_id')
    expect(rpc).not.toContain('target_player_id uuid default null')
    expect(rpc).not.toContain('where target_player_id is null or')
    expect(sql).toContain('revoke all on function public.read_player_contacts_admin(uuid) from public, anon, authenticated, service_role')
    expect(sql).toContain('grant execute on function public.read_player_contacts_admin(uuid) to authenticated')
  })

  it('retire les privilèges dangereux et conserve la RLS forcée', async () => {
    const sql = await readFile(migrationPath, 'utf8')

    expect(sql).toContain('revoke all privileges on table public.players from anon')
    expect(sql).toContain('revoke all privileges on table public.player_contacts from anon')
    expect(sql).toContain('revoke truncate, references, trigger on table public.players from service_role')
    expect(sql).toContain('revoke truncate, references, trigger on table public.player_contacts from service_role')
    expect(sql).toContain('alter table public.players force row level security')
    expect(sql).toContain('alter table public.player_contacts force row level security')
  })

  it('ne modifie ni membership ni donnée métier', async () => {
    const sql = await readFile(migrationPath, 'utf8')

    expect(sql).not.toMatch(/\b(?:insert|update|delete|truncate)\s+(?:into\s+|from\s+)?public\.(?:players|player_contacts|team_memberships)\b/i)
    expect(sql).not.toContain('player_contacts.visibility =')
  })
})
