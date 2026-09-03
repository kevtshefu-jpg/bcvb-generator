import { execFileSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'
import { assertSafeTestEnvironment, loadFixtureState, loadLocalEnv } from './rls-test-config.mjs'

const config = await loadLocalEnv()
assertSafeTestEnvironment(config, { operation: 'tests sécurité accès joueurs', requireServiceRole: true })
const state = await loadFixtureState()
if (!state) throw new Error('Fixtures RLS absentes. Exécuter npm run seed:rls.')

const service = createClient(config.url, config.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
const anon = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
const clients = {}
for (const name of ['admin', 'technicalManager', 'dirigeant', 'coachA', 'coachSameTeam', 'coachB', 'teamStaff', 'parentReferent', 'member', 'inactive']) {
  const account = state.accounts[name]
  const client = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { error } = await client.auth.signInWithPassword({ email: account.email, password: account.password })
  if (error) throw new Error(`${name}: authentification impossible: ${error.message}`)
  clients[name] = client
}

const databaseContainer = execFileSync('docker', ['ps', '--filter', 'name=supabase_db_', '--format', '{{.Names}}'], { encoding: 'utf8' })
  .split('\n').find((name) => name.includes('bcvb-generator'))
if (!databaseContainer) throw new Error('Conteneur PostgreSQL Supabase local introuvable.')
function psql(sql) {
  return execFileSync('docker', ['exec', databaseContainer, 'psql', '-U', 'postgres', '-d', 'postgres', '-X', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-c', sql], { encoding: 'utf8' }).trim()
}

let failures = 0
function check(condition, message, detail = '') {
  process.stdout.write(`${condition ? 'PASS' : 'FAIL'} ${message}${detail ? ` — ${detail}` : ''}\n`)
  if (!condition) failures += 1
}
function errorText(error) {
  return error ? `code=${error.code || 'absent'}, message=${error.message}` : ''
}
async function playerVisible(client, playerId) {
  const { data, error } = await client.from('players').select('id').eq('id', playerId)
  return { visible: !error && data?.length === 1, error }
}
async function currentAccess(client, playerId) {
  const { data, error } = await client.rpc('can_access_current_player', { target_player_id: playerId })
  return { allowed: data === true && !error, data, error }
}

const { teamA, teamB, playerA, contactA, attendanceSessionA, attendanceRecordA } = state.fixtures
const catalog = JSON.parse(psql(`
select json_build_object(
  'players_rls', (select relrowsecurity and relforcerowsecurity from pg_class where oid='public.players'::regclass),
  'contacts_rls', (select relrowsecurity and relforcerowsecurity from pg_class where oid='public.player_contacts'::regclass),
  'anon_players_none', not has_any_column_privilege('anon','public.players','SELECT,INSERT,UPDATE,REFERENCES')
    and not has_table_privilege('anon','public.players','DELETE,TRUNCATE,TRIGGER'),
  'anon_contacts_none', not has_any_column_privilege('anon','public.player_contacts','SELECT,INSERT,UPDATE,REFERENCES')
    and not has_table_privilege('anon','public.player_contacts','DELETE,TRUNCATE,TRIGGER'),
  'authenticated_players_select_only', has_table_privilege('authenticated','public.players','SELECT')
    and not has_table_privilege('authenticated','public.players','INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'),
  'authenticated_contacts_none', not has_any_column_privilege('authenticated','public.player_contacts','SELECT,INSERT,UPDATE,REFERENCES')
    and not has_table_privilege('authenticated','public.player_contacts','DELETE,TRUNCATE,TRIGGER'),
  'service_players_dml_only', has_table_privilege('service_role','public.players','SELECT,INSERT,UPDATE,DELETE')
    and not has_table_privilege('service_role','public.players','TRUNCATE,REFERENCES,TRIGGER'),
  'service_contacts_dml_only', has_table_privilege('service_role','public.player_contacts','SELECT,INSERT,UPDATE,DELETE')
    and not has_table_privilege('service_role','public.player_contacts','TRUNCATE,REFERENCES,TRIGGER')
)::text;
`))
for (const [name, value] of Object.entries(catalog)) check(value === true, `catalogue: ${name}`)

for (const signature of ['public.can_access_current_player(uuid)', 'public.read_player_contacts_admin(uuid)']) {
  const acl = psql(`select concat_ws('|',
    p.proowner=(select oid from pg_roles where rolname='postgres'), p.prosecdef,
    coalesce(array_to_string(p.proconfig,','),'')='search_path=public, pg_temp',
    has_function_privilege('authenticated',p.oid,'EXECUTE'),
    has_function_privilege('anon',p.oid,'EXECUTE'),
    has_function_privilege('service_role',p.oid,'EXECUTE'),
    exists(select 1 from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where a.grantee=0 and a.privilege_type='EXECUTE')
  ) from pg_proc p where p.oid='${signature}'::regprocedure;`)
  check(acl === 't|t|t|t|f|f|f', `ACL exacte ${signature}`, acl)
}

for (const name of ['coachA', 'coachSameTeam', 'teamStaff', 'parentReferent']) {
  const access = await currentAccess(clients[name], playerA)
  check(access.allowed, `${name}: joueur actif accessible`, errorText(access.error))
}
for (const name of ['coachB', 'member', 'inactive']) {
  const access = await currentAccess(clients[name], playerA)
  check(!access.error && access.data === false, `${name}: aucun accès current-player`, errorText(access.error))
}
const nullTarget = await clients.coachA.rpc('can_access_current_player', { target_player_id: null })
check(!nullTarget.error && nullTarget.data === false, 'helper: target null refusé')
const anonHelper = await anon.rpc('can_access_current_player', { target_player_id: playerA })
check(anonHelper.error?.code === '42501', 'anon: helper non exécutable', errorText(anonHelper.error))

for (const name of ['admin', 'technicalManager', 'dirigeant', 'coachA', 'teamStaff', 'parentReferent', 'member']) {
  const { error } = await clients[name].from('player_contacts').select('id').eq('id', contactA)
  check(error?.code === '42501', `${name}: table contacts refusée`, errorText(error))
}
for (const name of ['admin', 'technicalManager']) {
  const { data, error } = await clients[name].rpc('read_player_contacts_admin', { target_player_id: playerA })
  check(!error && data?.length === 1, `${name}: RPC contacts administrative`, errorText(error))
  const nullTarget = await clients[name].rpc('read_player_contacts_admin', { target_player_id: null })
  check(nullTarget.error?.code === '22023', `${name}: RPC contacts refuse un player_id NULL`, errorText(nullTarget.error))
}
for (const name of ['dirigeant', 'coachA', 'teamStaff', 'parentReferent', 'member', 'inactive']) {
  const { error } = await clients[name].rpc('read_player_contacts_admin', { target_player_id: playerA })
  check(error?.code === '42501', `${name}: RPC contacts refusée`, errorText(error))
}
const noArgument = await clients.admin.rpc('read_player_contacts_admin')
check(noArgument.error?.code === 'PGRST202', 'RPC contacts sans argument: signature inexistante', errorText(noArgument.error))
const anonContacts = await anon.rpc('read_player_contacts_admin', { target_player_id: playerA })
check(anonContacts.error?.code === '42501', 'anon: RPC contacts non exécutable', errorText(anonContacts.error))

for (const name of ['admin', 'technicalManager', 'coachA']) {
  const { error } = await clients[name].from('players').update({ updated_at: new Date().toISOString() }).eq('id', playerA)
  check(error?.code === '42501', `${name}: UPDATE player direct refusé`, errorText(error))
}
const directInsert = await clients.admin.from('players').insert({ first_name: 'Interdit', last_name: 'Direct' })
check(directInsert.error?.code === '42501', 'admin: INSERT player direct refusé', errorText(directInsert.error))
const directDelete = await clients.admin.from('players').delete().eq('id', playerA)
check(directDelete.error?.code === '42501', 'admin: DELETE player direct refusé', errorText(directDelete.error))

const membershipAResult = await clients.admin.from('team_memberships').select('id').eq('player_id', playerA).eq('team_id', teamA).eq('season', '2026-2027').single()
if (membershipAResult.error) throw new Error(`membership A introuvable: ${membershipAResult.error.message}`)
const membershipA = membershipAResult.data.id
let membershipB = null
let assignmentB = null

try {
  const deactivateA = await clients.admin.rpc('deactivate_team_membership', { target_membership_id: membershipA })
  check(!deactivateA.error && deactivateA.data?.[0]?.status === 'inactive', 'active → inactive via RPC M2', errorText(deactivateA.error))
  const inactiveAccess = await currentAccess(clients.coachA, playerA)
  const inactiveRead = await playerVisible(clients.coachA, playerA)
  check(!inactiveAccess.error && inactiveAccess.data === false && !inactiveRead.visible, 'inactive: coach perd la lecture current-player', errorText(inactiveRead.error))
  const inactiveUpdate = await clients.coachA.from('players').update({ updated_at: new Date().toISOString() }).eq('id', playerA)
  check(inactiveUpdate.error?.code === '42501', 'inactive: coach ne peut pas modifier le joueur', errorText(inactiveUpdate.error))

  const historical = await clients.coachA.rpc('read_attendance_records_versioned', { target_session_id: attendanceSessionA, target_player_id: playerA })
  check(!historical.error && historical.data?.some((record) => record.id === attendanceRecordA), 'inactive: historique Attendance reste lisible', errorText(historical.error))

  const reactivateA = await clients.admin.rpc('add_or_reactivate_team_membership', { target_player_id: playerA, target_team_id: teamA, target_season: '2026-2027' })
  check(!reactivateA.error && reactivateA.data?.[0]?.membership_id === membershipA && reactivateA.data[0].status === 'active', 'inactive → active conserve le même membership', errorText(reactivateA.error))
  const reactivated = await currentAccess(clients.coachA, playerA)
  check(reactivated.allowed, 'réactivation: accès coach restauré', errorText(reactivated.error))

  const addB = await clients.admin.rpc('add_or_reactivate_team_membership', { target_player_id: playerA, target_team_id: teamB, target_season: '2026-2027' })
  if (addB.error) throw new Error(`membership B: ${addB.error.message}`)
  membershipB = addB.data[0].membership_id
  const assignB = await clients.admin.rpc('assign_team_staff', { target_team_id: teamB, target_profile_id: state.accounts.coachSameTeam.id, target_assignment_role: 'assistant_coach' })
  if (assignB.error) throw new Error(`affectation multi-team: ${assignB.error.message}`)
  assignmentB = assignB.data.assignment_id

  await clients.admin.rpc('deactivate_team_membership', { target_membership_id: membershipA })
  check((await currentAccess(clients.coachA, playerA)).data === false, 'multi-team: coach A refusé si A inactive')
  check((await currentAccess(clients.coachB, playerA)).allowed, 'multi-team: coach B autorisé via B active')
  check((await currentAccess(clients.coachSameTeam, playerA)).allowed, 'multi-team: coach A+B autorisé via B active')

  await clients.admin.rpc('deactivate_team_membership', { target_membership_id: membershipB })
  check((await currentAccess(clients.coachB, playerA)).data === false, 'multi-team: tous memberships inactifs refusent coach B')
  check((await currentAccess(clients.coachSameTeam, playerA)).data === false, 'multi-team: tous memberships inactifs refusent coach A+B')

  await clients.admin.rpc('add_or_reactivate_team_membership', { target_player_id: playerA, target_team_id: teamA, target_season: '2026-2027' })
  check((await currentAccess(clients.coachA, playerA)).allowed, 'multi-team: réactivation A restaure coach A')

  const orphan = await service.from('players').insert({ first_name: 'Fixture', last_name: 'Sans membership', category: 'Test' }).select('id').single()
  if (orphan.error) throw new Error(`fixture sans membership: ${orphan.error.message}`)
  const orphanAccess = await currentAccess(clients.coachA, orphan.data.id)
  check(!orphanAccess.error && orphanAccess.data === false, 'aucun membership: DENY')
  await service.from('players').delete().eq('id', orphan.data.id)
} finally {
  await clients.admin.rpc('add_or_reactivate_team_membership', { target_player_id: playerA, target_team_id: teamA, target_season: '2026-2027' })
  if (membershipB || assignmentB) {
    psql(`delete from public.team_memberships where id='${membershipB || '00000000-0000-0000-0000-000000000000'}';
      delete from public.team_staff_assignments where id='${assignmentB || '00000000-0000-0000-0000-000000000000'}';`)
  }
}

const finalMembership = await clients.admin.from('team_memberships').select('id,status').eq('id', membershipA).single()
check(!finalMembership.error && finalMembership.data?.status === 'active', 'fixture restaurée active après tests', errorText(finalMembership.error))

if (failures) {
  process.stderr.write(`${failures} échec(s) sécurité player/contact.\n`)
  process.exit(1)
}
process.stdout.write('Sécurité player/contact validée.\n')
