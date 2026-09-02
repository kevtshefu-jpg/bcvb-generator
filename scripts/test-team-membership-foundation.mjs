import { execFileSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'
import { assertSafeTestEnvironment, loadFixtureState, loadLocalEnv } from './rls-test-config.mjs'

const config = await loadLocalEnv()
assertSafeTestEnvironment(config, { operation: 'tests M2 team memberships', requireServiceRole: true })
const state = await loadFixtureState()
if (!state) throw new Error('Fixtures RLS absentes. Exécuter npm run seed:rls.')

const service = createClient(config.url, config.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
const anon = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
const clients = {}
for (const name of ['admin', 'technicalManager', 'coachA', 'coachSameTeam', 'coachB', 'coachParentOnly', 'coachTeamStaffOnly', 'teamStaff', 'parentReferent', 'dirigeant', 'member', 'inactive', 'authenticatedWithoutProfile']) {
  const account = state.accounts[name]
  const client = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { error } = await client.auth.signInWithPassword({ email: account.email, password: account.password })
  if (error) throw new Error(`${name}: authentification impossible: ${error.message}`)
  clients[name] = client
}

let failures = 0
function check(condition, message, detail = '') {
  process.stdout.write(`${condition ? 'PASS' : 'FAIL'} ${message}${detail ? ` — ${detail}` : ''}\n`)
  if (!condition) failures += 1
}
function errorText(error) {
  return error ? `code=${error.code || 'absent'}, message=${error.message}` : ''
}
async function must(query, label) {
  const { data, error } = await query
  if (error) throw new Error(`${label}: ${error.message}`)
  return data
}

const databaseContainer = execFileSync('docker', ['ps', '--filter', 'name=supabase_db_', '--format', '{{.Names}}'], { encoding: 'utf8' })
  .split('\n').find((name) => name.includes('bcvb-generator'))
if (!databaseContainer) throw new Error('Conteneur PostgreSQL Supabase local introuvable.')
function psql(sql) {
  return execFileSync('docker', ['exec', databaseContainer, 'psql', '-U', 'postgres', '-d', 'postgres', '-X', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-c', sql], { encoding: 'utf8' }).trim()
}

const structure = JSON.parse(psql(`
  select json_build_object(
    'teams_key', exists(select 1 from pg_constraint where conrelid='public.teams'::regclass and conname='teams_id_season_key' and contype='u'),
    'membership_unique', exists(select 1 from pg_constraint where conrelid='public.team_memberships'::regclass and conname='team_memberships_player_team_season_key' and contype='u'),
    'status_check', exists(select 1 from pg_constraint where conrelid='public.team_memberships'::regclass and conname='team_memberships_status_check' and contype='c'),
    'season_check', exists(select 1 from pg_constraint where conrelid='public.team_memberships'::regclass and conname='team_memberships_season_canonical_check' and contype='c'),
    'season_default_absent', (select column_default is null from information_schema.columns where table_schema='public' and table_name='team_memberships' and column_name='season'),
    'team_fk', exists(select 1 from pg_constraint where conrelid='public.team_memberships'::regclass and conname='team_memberships_team_id_season_fkey' and confupdtype='a' and confdeltype='a'),
    'player_fk', exists(select 1 from pg_constraint where conrelid='public.team_memberships'::regclass and conname='team_memberships_player_id_fkey' and confupdtype='a' and confdeltype='a'),
    'no_cascade', not exists(select 1 from pg_constraint where conrelid='public.team_memberships'::regclass and contype='f' and confdeltype='c'),
    'touch_trigger', exists(select 1 from pg_trigger where tgrelid='public.team_memberships'::regclass and tgname='team_memberships_touch_updated_at' and not tgisinternal),
    'select_only_policy', (select count(*)=1 and bool_and(polcmd='r') from pg_policy where polrelid='public.team_memberships'::regclass),
    'authenticated_select', has_table_privilege('authenticated','public.team_memberships','SELECT'),
    'authenticated_no_dml', not (has_table_privilege('authenticated','public.team_memberships','INSERT') or has_table_privilege('authenticated','public.team_memberships','UPDATE') or has_table_privilege('authenticated','public.team_memberships','DELETE')),
    'service_no_dml', not (has_table_privilege('service_role','public.team_memberships','INSERT') or has_table_privilege('service_role','public.team_memberships','UPDATE') or has_table_privilege('service_role','public.team_memberships','DELETE'))
  )::text;
`))
for (const [key, value] of Object.entries(structure)) check(value === true, `structure: ${key}`)

for (const signature of ['public.add_or_reactivate_team_membership(uuid,uuid,text)', 'public.deactivate_team_membership(uuid)']) {
  const acl = psql(`select concat_ws('|',
    p.proowner=(select oid from pg_roles where rolname='postgres'), p.prosecdef,
    coalesce(array_to_string(p.proconfig,','),'')='search_path=public, pg_temp',
    has_function_privilege('authenticated',p.oid,'EXECUTE'),
    has_function_privilege('anon',p.oid,'EXECUTE'),
    has_function_privilege('service_role',p.oid,'EXECUTE'),
    exists(select 1 from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where a.grantee=0 and a.privilege_type='EXECUTE')
  ) from pg_proc p where p.oid='${signature}'::regprocedure;`).split('|')
  check(acl.join('|') === 't|t|t|t|f|f|f', `ACL réelle ${signature}`, acl.join('|'))
}

// Les contraintes sont testées directement dans PostgreSQL, chacune dans son sous-bloc annulé.
psql(`do $$ begin
  begin insert into public.team_memberships(player_id,team_id,season,status)
    values('${state.fixtures.playerA}','${state.fixtures.teamA}','2026-2027','active');
    raise exception 'duplicate accepted'; exception when unique_violation then null; end;
  begin insert into public.team_memberships(player_id,team_id,season,status)
    values('${state.fixtures.playerA}','${state.fixtures.teamB}','2027-2028','active');
    raise exception 'mismatch accepted'; exception when foreign_key_violation then null; end;
  begin insert into public.team_memberships(player_id,team_id,season,status)
    values('${state.fixtures.playerA}','${state.fixtures.teamB}','','active');
    raise exception 'blank accepted'; exception when check_violation then null; end;
  begin insert into public.team_memberships(player_id,team_id,season,status)
    values('${state.fixtures.playerA}','${state.fixtures.teamB}','2026-2027','pending');
    raise exception 'status accepted'; exception when check_violation then null; end;
end $$;`)
check(true, 'contraintes: duplicate, mismatch, saison vide et statut invalide refusés')

const suffix = crypto.randomUUID().slice(0, 8)
const player = await must(service.from('players').insert({ first_name: 'M2', last_name: `Local ${suffix}`, category: 'Test', archived_at: null, deleted_at: null }).select('id').single(), 'création joueur local M2')
const secondPlayer = await must(service.from('players').insert({ first_name: 'M2', last_name: `Concurrent ${suffix}`, category: 'Test', archived_at: null, deleted_at: null }).select('id').single(), 'création joueur concurrence M2')
const teams = []
for (const label of ['A', 'B']) {
  teams.push(await must(service.from('teams').insert({ name: `M2 Local ${suffix} ${label}`, category: 'Test', level: 'Test', season: '2026-2027' }).select('id').single(), `création team ${label}`))
}

const add = (client, playerId = player.id, teamId = teams[0].id) => client.rpc('add_or_reactivate_team_membership', {
  target_player_id: playerId, target_team_id: teamId, target_season: '2026-2027',
})
const first = await add(clients.admin)
const firstRow = first.data?.[0]
check(!first.error && firstRow?.status === 'active' && firstRow.changed === true, 'absent → active / changed=true', errorText(first.error))
const auditBefore = await must(clients.admin.from('team_memberships').select('created_by,created_at,updated_at').eq('id', firstRow.membership_id).single(), 'audit membership initial')
const again = await add(clients.admin)
check(!again.error && again.data?.[0]?.membership_id === firstRow.membership_id && again.data[0].changed === false, 'active → add idempotent, même ID')
const deactivate = await clients.technicalManager.rpc('deactivate_team_membership', { target_membership_id: firstRow.membership_id })
check(!deactivate.error && deactivate.data?.[0]?.status === 'inactive' && deactivate.data[0].changed === true, 'active → inactive / changed=true')
const inactiveRoster = await must(clients.admin.from('team_memberships').select('id').eq('team_id', teams[0].id).eq('season', '2026-2027').eq('status', 'active').eq('player_id', player.id), 'roster inactif M2')
check(inactiveRoster.length === 0, 'Attendance-compatible: membership inactive exclu du roster actif')
const auditInactive = await must(clients.admin.from('team_memberships').select('created_by,created_at,updated_at').eq('id', firstRow.membership_id).single(), 'audit membership inactif')
check(auditInactive.created_by === auditBefore.created_by && auditInactive.created_at === auditBefore.created_at && auditInactive.updated_at > auditBefore.updated_at, 'created audit conservé et updated_at avancé')
const deactivateAgain = await clients.admin.rpc('deactivate_team_membership', { target_membership_id: firstRow.membership_id })
check(!deactivateAgain.error && deactivateAgain.data?.[0]?.changed === false, 'inactive → deactivate idempotent')
const reactivate = await add(clients.technicalManager)
check(!reactivate.error && reactivate.data?.[0]?.membership_id === firstRow.membership_id && reactivate.data[0].changed === true, 'inactive → active, même ID')
const reactivatedRoster = await must(clients.admin.from('team_memberships').select('id').eq('team_id', teams[0].id).eq('season', '2026-2027').eq('status', 'active').eq('player_id', player.id), 'roster réactivé M2')
check(reactivatedRoster.length === 1, 'Attendance-compatible: membership réactivé réinclus')

const multiTeam = await add(clients.admin, player.id, teams[1].id)
check(!multiTeam.error && multiTeam.data?.[0]?.membership_id !== firstRow.membership_id, 'multi-équipe même saison autorisé', errorText(multiTeam.error))

for (const [label, client] of Object.entries({ anon, ...clients })) {
  if (['admin', 'technicalManager'].includes(label)) continue
  const result = await add(client, secondPlayer.id, teams[0].id)
  check(result.error?.code === '42501', `${label}: RPC write refusée`, errorText(result.error))
}

for (const [label, args] of [
  ['saison vide', { target_player_id: secondPlayer.id, target_team_id: teams[0].id, target_season: '' }],
  ['saison invalide', { target_player_id: secondPlayer.id, target_team_id: teams[0].id, target_season: '2026-2028' }],
  ['saison incohérente', { target_player_id: secondPlayer.id, target_team_id: teams[0].id, target_season: '2027-2028' }],
  ['joueur absent', { target_player_id: crypto.randomUUID(), target_team_id: teams[0].id, target_season: '2026-2027' }],
  ['équipe absente', { target_player_id: secondPlayer.id, target_team_id: crypto.randomUUID(), target_season: '2026-2027' }],
]) {
  const result = await clients.admin.rpc('add_or_reactivate_team_membership', args)
  check(result.error?.code === '22023', `${label}: RPC refusée en 22023`, errorText(result.error))
}

for (const label of ['admin', 'technicalManager', 'coachA']) {
  const insert = await clients[label].from('team_memberships').insert({ player_id: secondPlayer.id, team_id: teams[0].id, season: '2026-2027', status: 'active' })
  const update = await clients[label].from('team_memberships').update({ status: 'inactive' }).eq('id', firstRow.membership_id)
  const remove = await clients[label].from('team_memberships').delete().eq('id', firstRow.membership_id)
  check(Boolean(insert.error) && Boolean(update.error) && Boolean(remove.error), `${label}: DML table direct refusé`)
}

const concurrent = await Promise.all([add(clients.admin, secondPlayer.id), add(clients.technicalManager, secondPlayer.id)])
check(concurrent.every((result) => !result.error), 'concurrence add: deux appels terminent sans erreur', concurrent.map((r) => errorText(r.error)).join('; '))
const concurrentIds = concurrent.map((result) => result.data?.[0]?.membership_id)
check(concurrentIds[0] && concurrentIds[0] === concurrentIds[1], 'concurrence add: même membership_id')
const concurrentRows = await must(clients.admin.from('team_memberships').select('id').eq('player_id', secondPlayer.id).eq('team_id', teams[0].id).eq('season', '2026-2027'), 'compte concurrence')
check(concurrentRows.length === 1, 'concurrence add: une seule ligne')

await clients.admin.rpc('deactivate_team_membership', { target_membership_id: concurrentIds[0] })
const concurrentReactivation = await Promise.all([add(clients.admin, secondPlayer.id), add(clients.technicalManager, secondPlayer.id)])
check(concurrentReactivation.every((result) => !result.error) && concurrentReactivation.every((result) => result.data?.[0]?.membership_id === concurrentIds[0]), 'concurrence réactivation: une ligne active stable')

const archivedTeam = await must(service.from('teams').insert({ name: `M2 Local ${suffix} archived`, category: 'Test', level: 'Test', season: '2026-2027', archived_at: new Date().toISOString() }).select('id').single(), 'team archivée locale')
const archivedPlayer = await must(service.from('players').insert({ first_name: 'M2', last_name: `Archived ${suffix}`, category: 'Test', archived_at: new Date().toISOString() }).select('id').single(), 'joueur archivé local')
const deletedPlayer = await must(service.from('players').insert({ first_name: 'M2', last_name: `Deleted ${suffix}`, category: 'Test', deleted_at: new Date().toISOString() }).select('id').single(), 'joueur soft-deleted local')
const archivedTeamResult = await add(clients.admin, player.id, archivedTeam.id)
const archivedPlayerResult = await add(clients.admin, archivedPlayer.id, teams[0].id)
const deletedPlayerResult = await add(clients.admin, deletedPlayer.id, teams[0].id)
check(archivedTeamResult.error?.code === '22023', 'équipe archivée refusée', errorText(archivedTeamResult.error))
check(archivedPlayerResult.error?.code === '22023', 'joueur archivé refusé', errorText(archivedPlayerResult.error))
check(deletedPlayerResult.error?.code === '22023', 'joueur soft-deleted refusé', errorText(deletedPlayerResult.error))

const missing = await clients.admin.rpc('deactivate_team_membership', { target_membership_id: crypto.randomUUID() })
check(missing.error?.code === 'P0002', 'deactivate absent retourne P0002', errorText(missing.error))

const deleteTeam = await service.from('teams').delete().eq('id', teams[0].id)
const deletePlayer = await service.from('players').delete().eq('id', player.id)
check(deleteTeam.error?.code === '23503', 'DELETE team avec membership refusé par FK', errorText(deleteTeam.error))
check(deletePlayer.error?.code === '23503', 'DELETE player avec membership refusé par FK', errorText(deletePlayer.error))

const activeRows = await must(clients.admin.from('team_memberships').select('player_id,status').in('player_id', [player.id, secondPlayer.id]), 'lecture roster M2')
check(activeRows.filter((row) => row.status === 'active').length === 3, 'lecture roster: seules les relations actives attendues restent visibles')

// Nettoyage PostgreSQL strictement local : aucun droit métier Production n'est rouvert.
psql(`delete from public.team_memberships where player_id in ('${player.id}','${secondPlayer.id}','${archivedPlayer.id}','${deletedPlayer.id}');
  delete from public.teams where id in ('${teams[0].id}','${teams[1].id}','${archivedTeam.id}');
  delete from public.players where id in ('${player.id}','${secondPlayer.id}','${archivedPlayer.id}','${deletedPlayer.id}');`)

await Promise.all(Object.values(clients).map((client) => client.auth.signOut()))
if (failures) throw new Error(`${failures} contrôle(s) M2 en échec.`)
process.stdout.write('Tous les contrôles M2 team memberships sont passés.\n')
