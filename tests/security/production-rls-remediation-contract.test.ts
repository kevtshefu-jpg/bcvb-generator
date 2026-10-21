// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const script = resolve(process.cwd(), 'ops/manual/production-rls-hardening-2026-10-14.sql')
const runbook = resolve(process.cwd(), 'docs/security/production-rls-hardening-2026-10-14.md')

describe('manual production RLS remediation — NOT a deployment', () => {
  it('requires verified backup and cannot be deployed as a Supabase migration', async () => {
    const [sql, docs] = await Promise.all([readFile(script, 'utf8'), readFile(runbook, 'utf8')])
    expect(sql).toContain('DO NOT EXECUTE until a verified, restorable OFF-DATABASE backup')
    expect(docs).toContain('Sans confirmation du contrôle de restauration')
    expect(script).toContain('/ops/manual/')
    expect(sql.trimStart().toLowerCase()).not.toMatch(/^create table /)
  })

  it('protects all three exposed tables and removes anonymous write privileges', async () => {
    const sql = await readFile(script, 'utf8')
    for (const table of ['library_documents', 'player_content_unlocks', 'player_fundamental_progress']) {
      expect(sql).toContain(`alter table public.${table} enable row level security;`)
    }
    expect(sql).toContain('revoke insert, update, delete on public.library_documents from anon;')
    expect(sql).toContain('revoke all on public.player_content_unlocks, public.player_fundamental_progress from anon;')
    expect(sql).toContain('public.current_user_role()')
    expect(sql).toContain('uploaded_by = auth.uid()')
    expect(sql).toContain("public.current_user_role() not in ('inactive')")
    expect(sql).toContain("status = 'published' and audience = 'public'")
    expect(sql).toContain('Politiques bibliothèque inattendues')
    expect(sql).toContain('protect_profile_security_fields_trigger')
  })

  it('hardens all six legacy player policies against inactive profiles', async () => {
    const sql = await readFile(script, 'utf8')
    for (const name of [
      'player_unlocks_select_own_or_staff',
      'player_progress_select_own_or_staff',
      'staff_can_insert_player_unlocks',
      'staff_can_delete_player_unlocks',
      'staff_can_insert_player_progress',
      'staff_can_update_player_progress',
    ]) {
      expect(sql).toMatch(new RegExp(`alter policy ${name}\\b`, 'i'))
    }
    expect(sql).toContain("public.current_user_role() <> 'inactive'")
    expect(sql).toContain("public.current_user_role() in ('admin', 'coach', 'dirigeant')")
    expect(sql).toContain('Politiques joueur inattendues : arreter et auditer')
  })

  it('removes table privileges that can bypass or undermine RLS', async () => {
    const sql = await readFile(script, 'utf8')
    expect(sql).toMatch(/revoke truncate, trigger, references[\\s\\S]*?from anon, authenticated;/i)
    for (const privilege of ['TRUNCATE', 'TRIGGER', 'REFERENCES']) {
      expect(sql).toContain(`'${privilege}'`)
    }
    expect(sql).toContain('Privileges dangereux non revoques pour les roles API')
  })

  it('is atomic, non-destructive and explicitly checks postconditions', async () => {
    const sql = await readFile(script, 'utf8')
    expect(sql).toMatch(/\bbegin;[\s\S]*\bcommit;\s*$/i)
    expect(sql).not.toMatch(/^\s*(?:drop\s+table|truncate\s+(?:table\s+)?public\.|delete\s+from\s+public\.|update\s+public\.)/im)
    expect(sql).toContain('RLS non activée sur les trois tables')
    expect(sql).toContain('Privilèges anonymes non révoqués')
    expect(sql).toContain('Politiques bibliothèque incomplètes')
  })
})
