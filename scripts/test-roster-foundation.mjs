import { execFileSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'
import { assertSafeTestEnvironment, loadFixtureState, loadLocalEnv } from './rls-test-config.mjs'

const config = await loadLocalEnv()
assertSafeTestEnvironment(config, { operation: 'tests M3 generic roster foundation', requireServiceRole: true })
const state = await loadFixtureState()
if (!state) throw new Error('Fixtures RLS absentes. Exécuter npm run seed:rls.')

const service = createClient(config.url, config.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
const anon = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
const clients = {}
const clientNames = [
  'admin', 'technicalManager', 'dirigeant', 'coachA', 'coachSameTeam', 'coachB',
  'coachTeamStaffOnly', 'teamStaff', 'parentReferent', 'member', 'inactive',
]
for (const name of clientNames) {
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
async function must(resultPromise, label) {
  const result = await resultPromise
  if (result.error) throw new Error(`${label}: ${errorText(result.error)}`)
  return result.data
}
function createArgs(firstName, lastName, extras = {}) {
  return {
    operation_id: crypto.randomUUID(),
    target_first_name: firstName,
    target_last_name: lastName,
    ...extras,
  }
}
async function create(client, firstName, lastName, extras = {}) {
  return client.rpc('create_player_for_roster', createArgs(firstName, lastName, extras))
}
async function search(client, args) {
  return client.rpc('search_players_for_roster', args)
}

const suffix = crypto.randomUUID().slice(0, 8)
const prefix = `M3 ${suffix}`
const createdPlayerIds = new Set()
const createdTeamIds = new Set()
const createdMembershipIds = new Set()
const rememberPlayer = (result) => {
  const id = result?.data?.player_id
  if (id) createdPlayerIds.add(id)
  return id
}

try {
  const catalog = JSON.parse(psql(`select json_build_object(
    'first_check', exists(select 1 from pg_constraint where conrelid='public.players'::regclass and conname='players_first_name_nonblank_check'),
    'last_check', exists(select 1 from pg_constraint where conrelid='public.players'::regclass and conname='players_last_name_nonblank_check'),
    'new_index', to_regclass('public.players_license_normalized_unique_idx') is not null,
    'old_index_gone', to_regclass('public.players_license_unique_idx') is null,
    'audit_columns', (select count(*)=2 from information_schema.columns where table_schema='public' and table_name='team_memberships' and column_name in ('status_changed_at','status_changed_by')),
    'decision_rls', (select relrowsecurity and relforcerowsecurity from pg_class where oid='public.player_identity_decisions'::regclass),
    'operations_rls', (select relrowsecurity and relforcerowsecurity from pg_class where oid='public.player_roster_creation_operations'::regclass)
  )::text;`))
  for (const [name, value] of Object.entries(catalog)) check(value === true, `catalogue: ${name}`)

  const normalization = psql(`select concat_ws('|',
    public.normalize_player_license(null) is null,
    public.normalize_player_license('   ') is null,
    public.normalize_player_license(' vt-12 34 ')='VT-12 34',
    public.normalize_player_license('A.B/7')='A.B/7',
    public.normalize_player_name_compare('  Éloïse   D’ARC  ')='éloïse d''arc',
    public.normalize_player_name_compare('Jean‑Luc')='jean-luc',
    public.normalize_player_name_compare('Elise')<>public.normalize_player_name_compare('Élise')
  );`)
  check(normalization === 't|t|t|t|t|t|t', 'normalisation licence et noms conservatrice', normalization)

  const blankFirst = await service.from('players').insert({ first_name: ' ', last_name: 'Fixture M3' })
  const blankLast = await service.from('players').insert({ first_name: 'Fixture', last_name: ' ' })
  check(blankFirst.error?.code === '23514', 'CHECK refuse prénom blanc', errorText(blankFirst.error))
  check(blankLast.error?.code === '23514', 'CHECK refuse nom blanc', errorText(blankLast.error))

  const nullLicense = await create(clients.admin, prefix, 'Licence Null', { target_license_number: null })
  check(!nullLicense.error && nullLicense.data?.status === 'CREATED', 'Admin crée avec licence NULL', errorText(nullLicense.error))
  const nullLicenseId = rememberPlayer(nullLicense)
  const blankLicense = await create(clients.admin, prefix, 'Licence Blank', { target_license_number: '   ' })
  check(!blankLicense.error && blankLicense.data?.status === 'CREATED', 'licence blanche devient NULL', errorText(blankLicense.error))
  const blankLicenseId = rememberPlayer(blankLicense)
  const blankStored = await must(service.from('players').select('license_number').in('id', [nullLicenseId, blankLicenseId]), 'lecture licences nulles')
  check(blankStored.every((row) => row.license_number === null), 'aucune licence vide stockée')

  const exactLicense = `vt-${suffix}-ab 12`
  const exactCreate = await create(clients.admin, `${prefix} Élodie`, 'D’ARC', {
    target_birth_date: '2004-04-05', target_license_number: `  ${exactLicense}  `, target_category: 'Test',
  })
  check(!exactCreate.error && exactCreate.data?.status === 'CREATED', 'création licence canonique', errorText(exactCreate.error))
  const exactId = rememberPlayer(exactCreate)
  const exactStored = await must(service.from('players').select('license_number,created_by').eq('id', exactId).single(), 'audit joueur créé')
  check(exactStored.license_number === exactLicense.toUpperCase(), 'casse/espaces externes licence normalisés')
  check(exactStored.license_number.includes(' '), 'espace interne licence préservé')
  check(exactStored.license_number.includes('-'), 'ponctuation licence préservée')
  check(exactStored.created_by === state.accounts.admin.id, 'created_by correspond à Admin')

  const directDuplicate = await service.from('players').insert({ first_name: 'Index', last_name: 'Duplicate', license_number: ` ${exactLicense.toUpperCase()} ` })
  check(directDuplicate.error?.code === '23505', 'index normalisé arbitre les collisions', errorText(directDuplicate.error))

  const exactSearch = await search(clients.admin, {
    target_first_name: `${prefix} Élodie`, target_last_name: "D'ARC",
    target_birth_date: '2004-04-05', target_license_number: exactLicense.toUpperCase(),
  })
  check(!exactSearch.error && exactSearch.data?.match_state === 'EXACT' && exactSearch.data.candidates?.length === 1, 'recherche EXACT', errorText(exactSearch.error))
  const exactCandidate = exactSearch.data?.candidates?.[0]
  check(exactCandidate?.license_hint?.endsWith('B 12') && !exactCandidate.license_hint.includes(exactLicense.toUpperCase()), 'licence masquée')
  check(!('birth_date' in exactCandidate) && !('notes' in exactCandidate) && !('contacts' in exactCandidate), 'projection search sans DOB complète/contact/note')

  for (const [label, patch] of [
    ['prénom', { target_first_name: 'Conflit' }],
    ['nom', { target_last_name: 'Conflit' }],
    ['DOB', { target_birth_date: '2001-01-01' }],
  ]) {
    const conflict = await search(clients.admin, {
      target_first_name: `${prefix} Élodie`, target_last_name: "D'ARC",
      target_birth_date: '2004-04-05', target_license_number: exactLicense.toUpperCase(), ...patch,
    })
    check(!conflict.error && conflict.data?.match_state === 'AMBIGUOUS', `même licence avec ${label} contradictoire`, errorText(conflict.error))
  }

  const probable = await search(clients.admin, {
    target_first_name: `${prefix} Élodie`, target_last_name: 'D’ARC', target_birth_date: '2004-04-05',
  })
  check(!probable.error && probable.data?.match_state === 'PROBABLE' && probable.data.candidates?.[0]?.classification === 'PROBABLE', 'recherche PROBABLE nom+DOB')
  const nameOnly = await search(clients.admin, { target_first_name: `${prefix} Élodie`, target_last_name: 'D’ARC' })
  check(!nameOnly.error && nameOnly.data?.match_state !== 'EXACT', 'nom seul jamais EXACT')
  const noMatch = await search(clients.admin, { target_first_name: prefix, target_last_name: 'Absent' })
  check(!noMatch.error && noMatch.data?.match_state === 'NO_MATCH' && noMatch.data.candidates?.length === 0, 'recherche NO_MATCH')
  const dobOnly = await search(clients.admin, { target_birth_date: '2004-04-05' })
  check(dobOnly.error?.code === '22023', 'DOB seul refusé', errorText(dobOnly.error))
  for (const name of ['dirigeant', 'coachA', 'teamStaff', 'parentReferent', 'member', 'inactive']) {
    const deniedSearch = await search(clients[name], { target_first_name: prefix, target_last_name: 'Absent' })
    check(deniedSearch.error?.code === '42501', `${name}: recherche globale refusée`, errorText(deniedSearch.error))
  }
  const anonSearch = await search(anon, { target_first_name: prefix, target_last_name: 'Absent' })
  check(anonSearch.error?.code === '42501', 'anon: recherche RPC non exécutable', errorText(anonSearch.error))

  const archived = await must(service.from('players').insert({ first_name: prefix, last_name: 'Archived', birth_date: '2003-03-03', archived_at: new Date().toISOString() }).select('id').single(), 'fixture archivée')
  createdPlayerIds.add(archived.id)
  const archivedSearch = await search(clients.technicalManager, { target_first_name: prefix, target_last_name: 'Archived' })
  check(!archivedSearch.error && archivedSearch.data?.candidates?.[0]?.archived === true, 'archivé visible minimalement à RT')

  const deleted = await must(service.from('players').insert({ first_name: prefix, last_name: 'Deleted', birth_date: '2002-02-02', deleted_at: new Date().toISOString() }).select('id').single(), 'fixture soft-deleted')
  createdPlayerIds.add(deleted.id)
  const deletedSearch = await search(clients.admin, { target_first_name: prefix, target_last_name: 'Deleted', target_birth_date: '2002-02-02' })
  check(!deletedSearch.error && deletedSearch.data?.match_state === 'AMBIGUOUS' && deletedSearch.data.candidates?.length === 0, 'soft-deleted détecté sans être exposé')
  const deletedCreate = await create(clients.admin, prefix, 'Deleted', { target_birth_date: '2002-02-02' })
  check(!deletedCreate.error && deletedCreate.data?.status === 'CONFLICT', 'soft-deleted bloque création silencieuse')

  const rtCreate = await create(clients.technicalManager, prefix, 'RT Create')
  check(!rtCreate.error && rtCreate.data?.status === 'CREATED', 'RT crée un joueur', errorText(rtCreate.error))
  rememberPlayer(rtCreate)
  for (const name of ['coachA', 'dirigeant', 'coachTeamStaffOnly', 'teamStaff', 'parentReferent', 'member', 'inactive']) {
    const denied = await create(clients[name], prefix, `Denied ${name}`)
    check(denied.error?.code === '42501', `${name}: création refusée`, errorText(denied.error))
  }
  const anonCreate = await create(anon, prefix, 'Denied anon')
  check(anonCreate.error?.code === '42501', 'anon: création RPC non exécutable', errorText(anonCreate.error))
  const noMembership = await service.from('team_memberships').select('id', { count: 'exact', head: true }).in('player_id', [...createdPlayerIds])
  check(!noMembership.error && noMembership.count === 0, 'create player ne crée aucun membership', errorText(noMembership.error))

  const licenseRace = `${prefix}-RACE`.toUpperCase()
  const licenseRaceArgs = [
    createArgs(prefix, 'License Race', { target_birth_date: '2000-01-01', target_license_number: licenseRace }),
    createArgs(prefix, 'License Race', { target_birth_date: '2000-01-01', target_license_number: ` ${licenseRace.toLowerCase()} ` }),
  ]
  const licenseResults = await Promise.all([
    clients.admin.rpc('create_player_for_roster', licenseRaceArgs[0]),
    clients.technicalManager.rpc('create_player_for_roster', licenseRaceArgs[1]),
  ])
  check(licenseResults.every((item) => !item.error), 'concurrence licence: appels sans erreur brute', licenseResults.map((item) => errorText(item.error)).join('; '))
  check(licenseResults.filter((item) => item.data?.status === 'CREATED').length === 1 && licenseResults.filter((item) => item.data?.status === 'CONFLICT').length === 1, 'concurrence licence: un CREATED, un CONFLICT')
  licenseResults.forEach(rememberPlayer)
  const licenseRows = await must(service.from('players').select('id').eq('license_number', licenseRace), 'compte concurrence licence')
  check(licenseRows.length === 1, 'concurrence licence: exactement une ligne')
  licenseRows.forEach((row) => createdPlayerIds.add(row.id))

  const noLicenseArgs = [createArgs(prefix, 'No License Race', { target_birth_date: '2000-02-02' }), createArgs(prefix, 'No License Race', { target_birth_date: '2000-02-02' })]
  const noLicenseResults = await Promise.all([
    clients.admin.rpc('create_player_for_roster', noLicenseArgs[0]),
    clients.technicalManager.rpc('create_player_for_roster', noLicenseArgs[1]),
  ])
  check(noLicenseResults.filter((item) => item.data?.status === 'CREATED').length === 1 && noLicenseResults.filter((item) => item.data?.status === 'AMBIGUOUS').length === 1, 'concurrence sans licence: un CREATED, un AMBIGUOUS')
  noLicenseResults.forEach(rememberPlayer)
  const noLicenseRows = await must(service.from('players').select('id').eq('first_name', prefix).eq('last_name', 'No License Race').eq('birth_date', '2000-02-02'), 'compte concurrence sans licence')
  check(noLicenseRows.length === 1, 'concurrence sans licence: exactement une ligne')
  noLicenseRows.forEach((row) => createdPlayerIds.add(row.id))

  const sameOperation = crypto.randomUUID()
  const samePayload = createArgs(prefix, 'Operation Retry', { operation_id: sameOperation, target_birth_date: '2001-03-03' })
  const operationResults = await Promise.all([
    clients.admin.rpc('create_player_for_roster', samePayload),
    clients.admin.rpc('create_player_for_roster', samePayload),
  ])
  check(operationResults.every((item) => !item.error) && operationResults[0].data?.player_id === operationResults[1].data?.player_id, 'même operation_id: même joueur')
  operationResults.forEach(rememberPlayer)
  const changedPayload = await clients.admin.rpc('create_player_for_roster', { ...samePayload, target_last_name: 'Operation Changed' })
  check(changedPayload.error?.code === 'PT409', 'même operation_id avec payload différent refusé', errorText(changedPayload.error))

  const homonymBase = await create(clients.admin, prefix, 'True Homonym', { target_birth_date: '2001-04-04' })
  const homonymBaseId = rememberPlayer(homonymBase)
  const overrideOperation = crypto.randomUUID()
  const overrideArgs = createArgs(prefix, 'True Homonym', {
    operation_id: overrideOperation,
    target_birth_date: '2001-04-04',
    confirm_distinct_person: true,
    acknowledged_candidate_ids: [homonymBaseId],
    distinct_person_reason: 'Fixture locale : personne distincte confirmée.',
  })
  const override = await clients.technicalManager.rpc('create_player_for_roster', overrideArgs)
  check(!override.error && override.data?.status === 'CREATED' && override.data?.match_state === 'AMBIGUOUS', 'override personne distincte créé et explicite', errorText(override.error))
  const overrideId = rememberPlayer(override)
  const overrideRetry = await clients.technicalManager.rpc('create_player_for_roster', overrideArgs)
  check(!overrideRetry.error && overrideRetry.data?.player_id === overrideId && overrideRetry.data?.idempotent_replay === true, 'retry override retourne le même joueur')
  const decisionAudit = JSON.parse(psql(`select json_build_object(
    'decisions', (select count(*) from public.player_identity_decisions where operation_id='${overrideOperation}'),
    'operations', (select count(*) from public.player_roster_creation_operations where operation_id='${overrideOperation}'),
    'actor', (select decided_by='${state.accounts.technicalManager.id}'::uuid from public.player_identity_decisions where operation_id='${overrideOperation}'),
    'reason', (select btrim(reason)<>'' from public.player_identity_decisions where operation_id='${overrideOperation}')
  )::text;`))
  check(decisionAudit.decisions === 1 && decisionAudit.operations === 1 && decisionAudit.actor && decisionAudit.reason, 'override audité durablement une seule fois')

  const changedBase = await create(clients.admin, prefix, 'Changed Candidates', { target_birth_date: '2001-05-05' })
  const changedBaseId = rememberPlayer(changedBase)
  const extraCandidate = await must(service.from('players').insert({ first_name: prefix, last_name: 'Changed Candidates', birth_date: '2001-05-05' }).select('id').single(), 'second candidat concurrent')
  createdPlayerIds.add(extraCandidate.id)
  const staleOverride = await create(clients.admin, prefix, 'Changed Candidates', {
    target_birth_date: '2001-05-05', confirm_distinct_person: true,
    acknowledged_candidate_ids: [changedBaseId], distinct_person_reason: 'Liste devenue obsolète.',
  })
  check(staleOverride.error?.code === 'PT409', 'candidate set modifié exige une nouvelle revue', errorText(staleOverride.error))

  const { teamA, teamB, playerA, attendanceSessionA } = state.fixtures
  const auditFixturePlayer = await must(service.from('players').insert({
    first_name: `${prefix} Audit`,
    last_name: 'Untouched',
    category: 'Test',
  }).select('id').single(), 'joueur fixture audit')
  createdPlayerIds.add(auditFixturePlayer.id)
  const auditFixtureMembership = await clients.admin.rpc('add_or_reactivate_team_membership', {
    target_player_id: auditFixturePlayer.id,
    target_team_id: teamB,
    target_season: '2026-2027',
  })
  check(!auditFixtureMembership.error && Boolean(auditFixtureMembership.data?.[0]?.membership_id), 'fixture audit membership créée', errorText(auditFixtureMembership.error))
  const auditFixtureMembershipId = auditFixtureMembership.data?.[0]?.membership_id
  if (auditFixtureMembershipId) createdMembershipIds.add(auditFixtureMembershipId)
  const capabilities = {
    admin: [true, true, true, true, true, true, false],
    technicalManager: [true, true, true, true, true, true, false],
    dirigeant: [true, false, false, false, false, false, false],
    coachA: [true, false, false, false, false, false, false],
    coachSameTeam: [true, false, false, false, false, false, false],
    teamStaff: [true, false, false, false, false, false, false],
    parentReferent: [false, false, false, false, false, false, false],
    member: [false, false, false, false, false, false, false],
    inactive: [false, false, false, false, false, false, false],
  }
  for (const [name, expected] of Object.entries(capabilities)) {
    const result = await clients[name].rpc('get_roster_capabilities', { target_team_id: teamA })
    const row = result.data?.[0]
    const actual = row ? [row.can_view_roster, row.can_manage_roster, row.can_search_players, row.can_create_player, row.can_add_membership, row.can_deactivate_membership, row.can_archive_player] : []
    check(!result.error && JSON.stringify(actual) === JSON.stringify(expected), `${name}: matrice capabilities`, errorText(result.error))
  }
  const anonCaps = await anon.rpc('get_roster_capabilities', { target_team_id: teamA })
  check(anonCaps.error?.code === '42501', 'anon: capabilities non exécutables', errorText(anonCaps.error))

  for (const name of ['admin', 'technicalManager', 'dirigeant', 'coachA', 'coachSameTeam', 'teamStaff']) {
    const result = await clients[name].rpc('read_team_roster', { target_team_id: teamA })
    check(!result.error && result.data?.length === 2, `${name}: roster actif minimal lisible`, errorText(result.error))
    const row = result.data?.[0] || {}
    check(!('birth_date' in row) && !('license_number' in row) && !('notes' in row) && !('contacts' in row), `${name}: projection roster minimale`)
  }
  for (const name of ['coachB', 'coachTeamStaffOnly', 'parentReferent', 'member', 'inactive']) {
    const result = await clients[name].rpc('read_team_roster', { target_team_id: teamA })
    check(result.error?.code === '42501', `${name}: roster Team A refusé`, errorText(result.error))
  }
  const parentCanAccessTeam = await clients.parentReferent.rpc('can_access_team', { target_team_id: teamA })
  check(!parentCanAccessTeam.error && parentCanAccessTeam.data === true, 'fixture parent possède bien can_access_team')
  const parentRoster = await clients.parentReferent.rpc('read_team_roster', { target_team_id: teamA })
  check(parentRoster.error?.code === '42501', 'parent refusé malgré can_access_team', errorText(parentRoster.error))
  const dirigeantInactive = await clients.dirigeant.rpc('read_team_roster', { target_team_id: teamA, include_inactive: true })
  check(dirigeantInactive.error?.code === '42501', 'dirigeant: historique inactif refusé', errorText(dirigeantInactive.error))

  const membershipRow = await must(clients.admin.from('team_memberships').select('id,status_changed_at,status_changed_by').eq('player_id', auditFixturePlayer.id).eq('team_id', teamB).single(), 'membership fixture audit')
  check(membershipRow.status_changed_at === null && membershipRow.status_changed_by === null, 'membership existant sans faux backfill audit')
  const transitionMembershipRow = await must(clients.admin.from('team_memberships').select('id').eq('player_id', playerA).eq('team_id', teamA).single(), 'membership fixture transition')
  const attendanceBefore = await must(service.from('attendance_sessions').select('id').eq('id', attendanceSessionA), 'Attendance avant mutation locale')
  const deactivate = await clients.admin.rpc('deactivate_team_membership', { target_membership_id: transitionMembershipRow.id })
  check(!deactivate.error && deactivate.data?.[0]?.changed === true, 'désactivation membership auditée', errorText(deactivate.error))
  const deactivatedAudit = await must(clients.admin.from('team_memberships').select('status,status_changed_at,status_changed_by').eq('id', transitionMembershipRow.id).single(), 'audit désactivation')
  check(deactivatedAudit.status === 'inactive' && Boolean(deactivatedAudit.status_changed_at) && deactivatedAudit.status_changed_by === state.accounts.admin.id, 'acteur/date désactivation exacts')
  const inactiveRoster = await clients.admin.rpc('read_team_roster', { target_team_id: teamA })
  check(!inactiveRoster.error && !inactiveRoster.data.some((row) => row.player_id === playerA), 'membership inactif exclu du roster futur')
  const adminHistory = await clients.admin.rpc('read_team_roster', { target_team_id: teamA, include_inactive: true })
  check(!adminHistory.error && adminHistory.data.some((row) => row.player_id === playerA && row.membership_status === 'inactive'), 'Admin lit historique inactif')
  const deactivateAgain = await clients.admin.rpc('deactivate_team_membership', { target_membership_id: transitionMembershipRow.id })
  const unchangedAudit = await must(clients.admin.from('team_memberships').select('status_changed_at,status_changed_by').eq('id', transitionMembershipRow.id).single(), 'audit idempotent')
  check(!deactivateAgain.error && deactivateAgain.data?.[0]?.changed === false && unchangedAudit.status_changed_at === deactivatedAudit.status_changed_at && unchangedAudit.status_changed_by === deactivatedAudit.status_changed_by, 'ALREADY inactive ne modifie pas audit')
  const reactivate = await clients.technicalManager.rpc('add_or_reactivate_team_membership', { target_player_id: playerA, target_team_id: teamA, target_season: '2026-2027' })
  const reactivatedAudit = await must(clients.admin.from('team_memberships').select('status,status_changed_at,status_changed_by').eq('id', transitionMembershipRow.id).single(), 'audit réactivation')
  check(!reactivate.error && reactivate.data?.[0]?.changed === true && reactivatedAudit.status === 'active' && reactivatedAudit.status_changed_by === state.accounts.technicalManager.id, 'réactivation remplace audit par acteur réel')
  const activeAgain = await clients.admin.rpc('add_or_reactivate_team_membership', { target_player_id: playerA, target_team_id: teamA, target_season: '2026-2027' })
  const activeAuditUnchanged = await must(clients.admin.from('team_memberships').select('status_changed_at,status_changed_by').eq('id', transitionMembershipRow.id).single(), 'audit already active')
  check(!activeAgain.error && activeAgain.data?.[0]?.changed === false && activeAuditUnchanged.status_changed_at === reactivatedAudit.status_changed_at && activeAuditUnchanged.status_changed_by === reactivatedAudit.status_changed_by, 'ALREADY ACTIVE ne modifie pas audit')
  const attendanceAfter = await must(service.from('attendance_sessions').select('id').eq('id', attendanceSessionA), 'Attendance après mutation locale')
  check(JSON.stringify(attendanceAfter) === JSON.stringify(attendanceBefore), 'Attendance historique préservée')

  const multi = await clients.admin.rpc('add_or_reactivate_team_membership', { target_player_id: exactId, target_team_id: teamA, target_season: '2026-2027' })
  const multiB = await clients.admin.rpc('add_or_reactivate_team_membership', { target_player_id: exactId, target_team_id: teamB, target_season: '2026-2027' })
  check(!multi.error && !multiB.error && multi.data?.[0]?.membership_id !== multiB.data?.[0]?.membership_id, 'multi-team même saison autorisé')
  createdMembershipIds.add(multi.data[0].membership_id)
  createdMembershipIds.add(multiB.data[0].membership_id)

  for (let index = 1; index <= 4; index += 1) {
    const extra = await create(clients.admin, prefix, `Pilot ${index}`)
    const extraPlayerId = rememberPlayer(extra)
    check(!extra.error && Boolean(extraPlayerId), `pilote local: joueur ${index} créé`, errorText(extra.error))
    const extraMembership = await clients.admin.rpc('add_or_reactivate_team_membership', {
      target_player_id: extraPlayerId,
      target_team_id: teamA,
      target_season: '2026-2027',
    })
    check(!extraMembership.error && Boolean(extraMembership.data?.[0]?.membership_id), `pilote local: membership ${index} créé`, errorText(extraMembership.error))
    if (extraMembership.data?.[0]?.membership_id) createdMembershipIds.add(extraMembership.data[0].membership_id)
  }
  const sevenPlayerRoster = await clients.admin.rpc('read_team_roster', { target_team_id: teamA, include_inactive: false })
  check(!sevenPlayerRoster.error && sevenPlayerRoster.data?.length === 7, 'pilote local: 7 membres actifs lus sans constante UI', errorText(sevenPlayerRoster.error))

  const nextTeam = await must(service.from('teams').insert({ name: `${prefix} Next Season`, category: 'Test', level: 'Test', season: '2027-2028' }).select('id').single(), 'team saison suivante')
  createdTeamIds.add(nextTeam.id)
  const nextMembership = await clients.technicalManager.rpc('add_or_reactivate_team_membership', { target_player_id: exactId, target_team_id: nextTeam.id, target_season: '2027-2028' })
  check(!nextMembership.error && nextMembership.data?.[0]?.membership_id, 'transition saison réutilise le joueur', errorText(nextMembership.error))
  createdMembershipIds.add(nextMembership.data[0].membership_id)
  const exactPlayerRows = await must(service.from('players').select('id').eq('id', exactId), 'preuve non-clonage')
  check(exactPlayerRows.length === 1, 'transition saison sans clone joueur')

  const archivedMembership = await clients.admin.rpc('add_or_reactivate_team_membership', { target_player_id: archived.id, target_team_id: teamA, target_season: '2026-2027' })
  check(archivedMembership.error?.code === '22023', 'joueur archivé ne reçoit pas de membership', errorText(archivedMembership.error))

  for (const signature of [
    'public.search_players_for_roster(text,text,text,date,integer)',
    'public.create_player_for_roster(uuid,text,text,date,text,text,integer,text,text,text,boolean,uuid[],text)',
    'public.get_roster_capabilities(uuid)',
    'public.read_team_roster(uuid,boolean)',
  ]) {
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
  const tableAcl = JSON.parse(psql(`select json_build_object(
    'player_dml_closed', not has_table_privilege('authenticated','public.players','INSERT,UPDATE,DELETE'),
    'membership_dml_closed', not has_table_privilege('authenticated','public.team_memberships','INSERT,UPDATE,DELETE'),
    'contacts_unchanged', not has_any_column_privilege('authenticated','public.player_contacts','SELECT,INSERT,UPDATE,REFERENCES') and not has_table_privilege('authenticated','public.player_contacts','DELETE,TRUNCATE,TRIGGER'),
    'decision_closed', not has_any_column_privilege('authenticated','public.player_identity_decisions','SELECT,INSERT,UPDATE,REFERENCES') and not has_table_privilege('authenticated','public.player_identity_decisions','DELETE,TRUNCATE,TRIGGER'),
    'operations_closed', not has_any_column_privilege('authenticated','public.player_roster_creation_operations','SELECT,INSERT,UPDATE,REFERENCES') and not has_table_privilege('authenticated','public.player_roster_creation_operations','DELETE,TRUNCATE,TRIGGER')
  )::text;`))
  for (const [name, value] of Object.entries(tableAcl)) check(value === true, `grants: ${name}`)
} finally {
  // PostgreSQL cleanup is intentionally local and bypasses application ACL only
  // to leave the shared RLS fixture baseline unchanged for subsequent suites.
  const playerIds = [...createdPlayerIds].filter(Boolean)
  const teamIds = [...createdTeamIds].filter(Boolean)
  const membershipIds = [...createdMembershipIds].filter(Boolean)
  if (playerIds.length || teamIds.length || membershipIds.length) {
    const playerList = playerIds.map((id) => `'${id}'::uuid`).join(',') || "'00000000-0000-0000-0000-000000000000'::uuid"
    const teamList = teamIds.map((id) => `'${id}'::uuid`).join(',') || "'00000000-0000-0000-0000-000000000000'::uuid"
    const membershipList = membershipIds.map((id) => `'${id}'::uuid`).join(',') || "'00000000-0000-0000-0000-000000000000'::uuid"
    psql(`delete from public.team_memberships where id in (${membershipList}) or player_id in (${playerList});
      delete from public.player_identity_decisions where created_player_id in (${playerList});
      delete from public.player_roster_creation_operations where created_player_id in (${playerList});
      delete from public.teams where id in (${teamList});
      delete from public.players where id in (${playerList});`)
  }
  await Promise.all(Object.values(clients).map((client) => client.auth.signOut()))
}

if (failures) throw new Error(`${failures} contrôle(s) M3 en échec.`)
process.stdout.write('Tous les contrôles M3 generic roster foundation sont passés.\n')
