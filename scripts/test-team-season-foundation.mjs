import { createClient } from '@supabase/supabase-js'
import { assertSafeTestEnvironment, loadFixtureState, loadLocalEnv } from './rls-test-config.mjs'

const config = await loadLocalEnv()
assertSafeTestEnvironment(config, { operation: 'tests locaux M1 équipe-saison', requireServiceRole: true })
const state = await loadFixtureState()
if (!state?.accounts?.admin || !state?.accounts?.technicalManager) throw new Error('Fixtures RLS M1 absentes.')

const service = createClient(config.url, config.serviceRoleKey, { auth: { persistSession: false } })
const anon = createClient(config.url, config.anonKey, { auth: { persistSession: false } })

async function signedIn(account) {
  const client = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { error } = await client.auth.signInWithPassword({ email: account.email, password: account.password })
  if (error) throw new Error(`Connexion fixture M1 impossible : ${error.message}`)
  return client
}

const names = ['admin', 'technicalManager', 'coachA', 'teamStaff', 'parentReferent', 'dirigeant', 'member', 'inactive', 'authenticatedWithoutProfile']
const clients = Object.fromEntries(await Promise.all(names.map(async (name) => [name, await signedIn(state.accounts[name])])))
let failures = 0
function check(condition, message, detail = '') {
  process.stdout.write(`${condition ? 'PASS' : 'FAIL'} ${message}${detail ? ` — ${detail}` : ''}\n`)
  if (!condition) failures += 1
}
function errorText(error) { return `code=${error?.code ?? 'absent'}, message=${error?.message ?? 'absent'}` }
async function must(resultPromise, label) {
  const result = await resultPromise
  if (result.error) throw new Error(`${label}: ${errorText(result.error)}`)
  return result.data
}
const payload = (name, overrides = {}) => ({
  target_name: name,
  target_category: 'U15 Test',
  target_level: 'Régional Test',
  target_season: '2026-2027',
  ...overrides,
})

async function cleanup() {
  const teams = await must(service.from('teams').select('id').ilike('name', 'M1 Test%'), 'lecture nettoyage teams M1')
  const ids = teams.map((team) => team.id)
  if (!ids.length) return
  for (const table of ['sessions', 'situations']) await must(service.from(table).delete().in('team_id', ids), `nettoyage ${table} M1`)
  await must(service.from('player_passports').delete().in('current_team_id', ids), 'nettoyage passports M1')
  await must(service.from('roster_import_batches').delete().in('target_team_id', ids), 'nettoyage imports M1')
  await must(service.from('teams').delete().in('id', ids), 'nettoyage teams M1')
}

await cleanup()

// Validation des champs et saisons.
for (const season of ['2026-2027', '2027-2028']) {
  const result = await clients.admin.rpc('create_team_season', payload(`M1 Test saison ${season}`, { target_season: season }))
  check(!result.error && result.data?.created === true && result.data?.status === 'CREATED', `saison valide ${season}`, errorText(result.error))
}
for (const [label, overrides] of [
  ['saison vide', { target_season: '' }],
  ['saison whitespace', { target_season: '   ' }],
  ['saison slash', { target_season: '2026/2027' }],
  ['saison courte', { target_season: '26-27' }],
  ['saison identique', { target_season: '2026-2026' }],
  ['saison non consécutive', { target_season: '2026-2028' }],
  ['nom vide', { target_name: '   ' }],
  ['catégorie vide', { target_category: '' }],
  ['niveau vide', { target_level: '   ' }],
]) {
  const { error } = await clients.admin.rpc('create_team_season', payload(`M1 Test invalide ${label}`, overrides))
  check(error?.code === '22023', `${label} refusé en 22023`, errorText(error))
}

// Sécurité fail-closed.
for (const name of ['coachA', 'teamStaff', 'parentReferent', 'dirigeant', 'member', 'inactive', 'authenticatedWithoutProfile']) {
  const { error } = await clients[name].rpc('create_team_season', payload(`M1 Test rôle ${name}`))
  check(error?.code === '42501', `${name}: création refusée`, errorText(error))
}
const { error: anonError } = await anon.rpc('create_team_season', payload('M1 Test rôle anon'))
check(anonError?.code === '42501', 'anon: création refusée', errorText(anonError))
for (const name of ['admin', 'technicalManager']) {
  const { data, error } = await clients[name].rpc('create_team_season', payload(`M1 Test rôle autorisé ${name}`))
  check(!error && data?.created === true, `${name}: création autorisée`, errorText(error))
}

// Normalisation, idempotence et identités distinctes.
const canonical = await clients.admin.rpc('create_team_season', payload('M1 Test RF3 - SF'))
const duplicateInputs = [
  payload('m1 test rf3 - sf'),
  payload('  M1 Test RF3 - SF  '),
  payload('M1  Test  RF3  -  SF'),
]
for (const duplicatePayload of duplicateInputs) {
  const { data, error } = await clients.admin.rpc('create_team_season', duplicatePayload)
  check(!error && data?.created === false && data?.status === 'ALREADY_EXISTS' && data?.team_id === canonical.data?.team_id,
    'doublon normalisé retourne ALREADY_EXISTS', errorText(error))
}
const distinctOne = await clients.admin.rpc('create_team_season', payload('M1 Test U15 F 1'))
const distinctTwo = await clients.admin.rpc('create_team_season', payload('M1 Test U15 F 2'))
const accented = await clients.admin.rpc('create_team_season', payload('M1 Test Élite'))
const unaccented = await clients.admin.rpc('create_team_season', payload('M1 Test Elite'))
check([distinctOne, distinctTwo, accented, unaccented].every((result) => !result.error && result.data?.created), 'suffixes et accents distincts restent créables')

// Filet DB indépendant de la RPC.
const directDuplicate = await service.from('teams').insert({ name: ' m1  test  rf3 - sf ', category: 'u15 test', level: 'régional test', season: '2026-2027' })
check(directDuplicate.error?.code === '23505', 'index unique normalisé refuse un insert direct concurrent', errorText(directDuplicate.error))

// Vraie concurrence : advisory lock + index, une création et une réutilisation.
const concurrentPayload = payload('M1 Test concurrence')
const concurrent = await Promise.all([
  clients.admin.rpc('create_team_season', concurrentPayload),
  clients.technicalManager.rpc('create_team_season', concurrentPayload),
])
check(concurrent.every((result) => !result.error), 'deux appels concurrents terminent sans erreur brute')
check(concurrent.filter((result) => result.data?.status === 'CREATED').length === 1, 'concurrence: exactement un CREATED')
check(concurrent.filter((result) => result.data?.status === 'ALREADY_EXISTS').length === 1, 'concurrence: exactement un ALREADY_EXISTS')
const concurrentRows = await must(service.from('teams').select('id', { count: 'exact' }).eq('name', 'M1 Test concurrence'), 'compte concurrence M1')
check(concurrentRows.length === 1, 'concurrence: exactement une team persistée')

// created_by/timestamps et absence d'effet sportif secondaire.
const createdId = canonical.data?.team_id
const createdRow = await must(service.from('teams').select('created_by,created_at,updated_at,head_coach_id,assistant_coach_ids').eq('id', createdId).single(), 'lecture audit création M1')
check(createdRow.created_by === state.accounts.admin.id && Boolean(createdRow.created_at) && Boolean(createdRow.updated_at), 'created_by et timestamps serveur renseignés')
const dependencyCounts = await Promise.all([
  service.from('team_memberships').select('id', { count: 'exact', head: true }).eq('team_id', createdId),
  service.from('team_staff_assignments').select('id', { count: 'exact', head: true }).eq('team_id', createdId),
  service.from('training_slots').select('id', { count: 'exact', head: true }).eq('team_id', createdId),
  service.from('attendance_sessions').select('id', { count: 'exact', head: true }).eq('team_id', createdId),
  service.from('sessions').select('id', { count: 'exact', head: true }).eq('team_id', createdId),
  service.from('situations').select('id', { count: 'exact', head: true }).eq('team_id', createdId),
])
check(dependencyCounts.every((result) => !result.error && result.count === 0) && createdRow.head_coach_id === null && createdRow.assistant_coach_ids?.length === 0,
  'create_team_season ne crée aucune donnée sportive associée')

// Saison corrigeable sur team vierge.
const virgin = await must(service.from('teams').insert({ name: 'M1 Test vierge', category: 'Test', level: 'Test', season: '2026-2027' }).select('id').single(), 'création team vierge')
const virginUpdate = await service.from('teams').update({ season: '2027-2028' }).eq('id', virgin.id).select('season').single()
check(!virginUpdate.error && virginUpdate.data?.season === '2027-2028', 'team vierge: correction de saison autorisée', errorText(virginUpdate.error))

const playerId = state.fixtures.playerA
const profileId = state.accounts.member.id
const adminId = state.accounts.admin.id
const dependencies = [
  ['membership inactive', async (teamId) => must(service.from('team_memberships').insert({ player_id: playerId, team_id: teamId, season: '2026-2027', status: 'inactive' }), 'fixture membership M1')],
  ['staff inactive', async (teamId) => must(service.from('team_staff_assignments').insert({ team_id: teamId, profile_id: profileId, assignment_role: 'team_staff', is_active: false }), 'fixture staff M1')],
  ['slot inactive', async (teamId) => must(service.from('training_slots').insert({ team_id: teamId, season: '2026-2027', weekday: 1, start_time: '18:00', end_time: '19:00', valid_from: '2026-09-01', is_active: false }), 'fixture slot M1')],
  ['Attendance draft', async (teamId) => must(service.from('attendance_sessions').insert({ team_id: teamId, session_date: '2031-01-01', status: 'draft', created_by: adminId }), 'fixture Attendance M1')],
  ['Attendance validated', async (teamId) => must(service.from('attendance_sessions').insert({ team_id: teamId, session_date: '2031-01-02', status: 'validated', validated_by: adminId, validated_at: new Date().toISOString(), created_by: adminId }), 'fixture Attendance validée M1')],
  ['sports session', async (teamId) => must(service.from('sessions').insert({ title: 'M1 Test session', category: 'Test', team_id: teamId, coach_id: adminId, owner_id: adminId, visibility: 'private', status: 'draft' }), 'fixture session M1')],
  ['situation', async (teamId) => must(service.from('situations').insert({ title: 'M1 Test situation', category: 'Test', team_id: teamId, owner_id: adminId, created_by: adminId, visibility: 'private', status: 'draft' }), 'fixture situation M1')],
  ['passport', async (teamId) => must(service.from('player_passports').insert({ player_id: playerId, current_team_id: teamId, season: '2026-2027' }), 'fixture passport M1')],
  ['import batch', async (teamId) => must(service.from('roster_import_batches').insert({ file_name: 'm1-test.csv', file_type: 'csv', season: '2026-2027', target_team_id: teamId }), 'fixture import M1')],
]
let nonSeasonTeamId
for (const [label, createDependency] of dependencies) {
  const team = await must(service.from('teams').insert({ name: `M1 Test dépendance ${label}`, category: 'Test', level: 'Test', season: '2026-2027' }).select('id').single(), `création team ${label}`)
  await createDependency(team.id)
  const update = await service.from('teams').update({ season: '2027-2028' }).eq('id', team.id)
  check(update.error?.code === 'PT409', `${label}: saison immuable`, errorText(update.error))
  if (label === 'membership inactive') nonSeasonTeamId = team.id
}

// Le trigger ne bloque que season.
for (const patch of [
  { name: 'M1 Test dépendance renommée' },
  { category: 'Catégorie modifiée' },
  { level: 'Niveau modifié' },
  { archived_at: new Date().toISOString() },
]) {
  const result = await service.from('teams').update(patch).eq('id', nonSeasonTeamId).select('id').single()
  check(!result.error, `mise à jour hors saison non bloquée (${Object.keys(patch)[0]})`, errorText(result.error))
}

// La synchronisation staff legacy ne déclenche pas la protection season.
const staffSyncTeam = await must(service.from('teams').insert({ name: 'M1 Test staff sync', category: 'Test', level: 'Test', season: '2026-2027' }).select('id').single(), 'team staff sync M1')
const assigned = await clients.admin.rpc('assign_team_staff', { target_team_id: staffSyncTeam.id, target_profile_id: state.accounts.coachA.id, target_assignment_role: 'head_coach' })
const synced = await must(service.from('teams').select('head_coach_id,season').eq('id', staffSyncTeam.id).single(), 'lecture staff sync M1')
check(!assigned.error && synced.head_coach_id === state.accounts.coachA.id && synced.season === '2026-2027', 'trigger staff legacy compatible avec immutabilité season', errorText(assigned.error))

await cleanup()
await Promise.all(Object.values(clients).map((client) => client.auth.signOut()))
if (failures) throw new Error(`${failures} contrôle(s) M1 en échec.`)
process.stdout.write('Tous les contrôles M1 équipe-saison sont passés.\n')
