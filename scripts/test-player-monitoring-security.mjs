import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'
import { loadLocalEnv, loadFixtureState, assertSafeTestEnvironment, projectRefFromUrl } from './rls-test-config.mjs'

const config = await loadLocalEnv()
// These mutation tests must never run against a remote database.
assert.equal(projectRefFromUrl(config.url), 'local')
assertSafeTestEnvironment(config, { operation: 'monitoring security integration', requireServiceRole: true })
const state = await loadFixtureState()
assert.ok(state, 'Seed local fixtures first')
const options = { auth: { persistSession: false, autoRefreshToken: false } }
const service = createClient(config.url, config.serviceRoleKey, options)
const anon = createClient(config.url, config.anonKey, options)
const clients = {}
for (const [name, account] of Object.entries(state.accounts)) {
  const client = createClient(config.url, config.anonKey, options)
  const { error } = await client.auth.signInWithPassword({ email: account.email, password: account.password })
  assert.equal(error, null, `${name}: sign in`)
  clients[name] = client
}
const { playerA, teamA, teamB } = state.fixtures
const { data: team, error: teamError } = await service.from('teams').select('season').eq('id', teamA).single()
assert.equal(teamError, null)
const input = {
  target_player_id: playerA, target_team_id: teamA, target_season: team.season,
  target_monitored_on: '2026-10-08', target_session_rpe: 6, target_session_duration_minutes: 60,
  target_fatigue: 4, target_soreness: 2, target_sleep_quality: 7, target_pain: 1,
  target_availability: 'normal', target_note: 'LOCAL_MONITORING_SECURITY_FIXTURE',
}
let checks = 0
function check(condition, name) { assert.ok(condition, name); checks++; console.log(`PASS ${name}`) }
const readArgs = { target_player_id: playerA, target_team_id: teamA }
for (const name of ['admin', 'technicalManager', 'coachA', 'coachSameTeam']) {
  const saved = await clients[name].rpc('save_player_monitoring', input)
  check(!saved.error && typeof saved.data === 'string', `${name}: write allowed`)
  const read = await clients[name].rpc('read_player_monitoring', readArgs)
  check(!read.error && read.data.some(r => r.note === input.target_note), `${name}: read allowed`)
}
for (const name of ['coachB', 'coachParentOnly', 'coachTeamStaffOnly', 'teamStaff', 'parentReferent', 'dirigeant', 'member', 'inactive', 'authenticatedWithoutProfile']) {
  for (const [rpc, args] of [['read_player_monitoring', readArgs], ['save_player_monitoring', input]]) {
    const result = await clients[name].rpc(rpc, args)
    check(result.error?.code === '42501', `${name}: ${rpc} denied`)
  }
  const helper = await clients[name].rpc('can_access_player_monitoring', readArgs)
  check(!helper.error && helper.data === false, `${name}: helper returns false`)
}
for (const [rpc, args] of [['read_player_monitoring', readArgs], ['save_player_monitoring', input], ['can_access_player_monitoring', readArgs]]) {
  check((await anon.rpc(rpc, args)).error?.code === '42501', `anonymous: ${rpc} denied`)
}
for (const name of ['admin', 'coachA', 'parentReferent']) {
  check((await clients[name].from('player_monitoring_entries').select('*')).error?.code === '42501', `${name}: raw table denied`)
}
for (const args of [
  { ...readArgs, target_team_id: null }, { ...readArgs, target_player_id: null },
  { ...readArgs, target_team_id: teamB },
]) {
  const result = await clients.coachA.rpc('read_player_monitoring', args)
  check(result.error?.code === '42501', 'coach: missing/wrong scope denied')
}
check((await clients.coachA.rpc('save_player_monitoring', { ...input, target_team_id: teamB })).error?.code === '42501', 'coach: cross-team write denied')
// Verify current membership revocation affects both RPCs, restoring the fixture even on failure.
const membership = await clients.admin.rpc('add_or_reactivate_team_membership', { target_player_id: playerA, target_team_id: teamA, target_season: team.season })
assert.equal(membership.error, null)
const membershipA = membership.data[0].membership_id
const changed = await clients.admin.rpc('deactivate_team_membership', { target_membership_id: membershipA })
assert.equal(changed.error, null)
try {
  check((await clients.coachA.rpc('read_player_monitoring', readArgs)).error?.code === '42501', 'inactive membership: read denied')
  check((await clients.coachA.rpc('save_player_monitoring', input)).error?.code === '42501', 'inactive membership: write denied')
} finally {
  const restored = await clients.admin.rpc('add_or_reactivate_team_membership', { target_player_id: playerA, target_team_id: teamA, target_season: team.season })
  assert.equal(restored.error, null)
}
const container = execFileSync('docker', ['ps', '--filter', 'name=supabase_db_', '--format', '{{.Names}}'], { encoding: 'utf8' }).trim().split('\n').find(n => n.includes('bcvb-generator'))
assert.ok(container)
function sql(query) { return execFileSync('docker', ['exec', container, 'psql', '-U', 'postgres', '-d', 'postgres', '-X', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-c', query], { encoding: 'utf8' }).trim() }
for (const signature of [
 'public.can_access_player_monitoring(uuid,uuid)', 'public.read_player_monitoring(uuid,uuid)',
 'public.save_player_monitoring(uuid,uuid,text,date,smallint,smallint,smallint,smallint,smallint,smallint,text,text)',
]) {
  check(sql(`select p.prosecdef and p.proowner=(select oid from pg_roles where rolname='postgres')
    and p.proconfig @> array['search_path=public, pg_temp']
    and has_function_privilege('authenticated',p.oid,'EXECUTE')
    and not has_function_privilege('anon',p.oid,'EXECUTE')
    and not has_function_privilege('service_role',p.oid,'EXECUTE')
    and not exists(select 1 from aclexplode(p.proacl) a where a.grantee=0 and a.privilege_type='EXECUTE')
    from pg_proc p where p.oid='${signature}'::regprocedure`) === 't', `ACL and SECURITY DEFINER: ${signature}`)
}
check(sql("select relrowsecurity and relforcerowsecurity from pg_class where oid='public.player_monitoring_entries'::regclass") === 't', 'RLS enabled and forced')
console.log(`${checks} monitoring security checks passed`)
