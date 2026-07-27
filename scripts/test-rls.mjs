import { createClient } from '@supabase/supabase-js'
import { assertSafeTestEnvironment, fixtureFile, loadFixtureState, loadLocalEnv } from './rls-test-config.mjs'

const config = await loadLocalEnv()
const url = config.url
const anonKey = config.anonKey

const projectRef = assertSafeTestEnvironment(config, { operation: 'tests RLS avec JWT' })

const fixtureState = await loadFixtureState()
if (!fixtureState) {
  throw new Error(`Fixtures absentes. Exécuter d’abord npm run seed:rls (${fixtureFile}).`)
}
if (fixtureState.target?.projectRef !== projectRef) {
  throw new Error(`Fixtures créées pour ${fixtureState.target?.projectRef || 'une cible inconnue'}, cible actuelle ${projectRef}. Relancer seed:rls.`)
}

const accountNames = ['admin', 'technicalManager', 'coachA', 'coachB', 'dirigeant', 'member', 'inactive']
const missingAccounts = accountNames.filter((name) => !fixtureState.accounts?.[name]?.email || !fixtureState.accounts?.[name]?.password)
if (missingAccounts.length) throw new Error(`Comptes absents du seed : ${missingAccounts.join(', ')}`)

const accounts = Object.fromEntries(accountNames.map((name) => [
  name,
  [fixtureState.accounts[name].email, fixtureState.accounts[name].password],
]))
const fixtures = fixtureState.fixtures || {}

const missingFixtures = Object.entries(fixtures).filter(([, value]) => !value).map(([name]) => name)
if (missingFixtures.length) {
  throw new Error(`Fixtures RLS manquantes : ${missingFixtures.join(', ')}. Aucun test d’isolation ne peut être ignoré.`)
}

let failures = 0

function check(condition, message, detail = '') {
  const marker = condition ? 'PASS' : 'FAIL'
  process.stdout.write(`${marker} ${message}${detail ? ` — ${detail}` : ''}\n`)
  if (!condition) failures += 1
}

function formatPostgrestError(error) {
  return [
    `code=${error?.code ?? 'absent'}`,
    `message=${error?.message ?? 'absent'}`,
    `details=${error?.details ?? 'absent'}`,
    `hint=${error?.hint ?? 'absent'}`,
  ].join(', ')
}

async function authenticatedClient(email, password) {
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Connexion impossible pour ${email}: ${error.message}`)
  return client
}

const clients = Object.fromEntries(await Promise.all(
  Object.entries(accounts).map(async ([name, [email, password]]) => [
    name,
    await authenticatedClient(email, password),
  ]),
))

for (const [name, expectedRole] of [
  ['admin', 'admin'],
  ['technicalManager', 'responsable_technique'],
  ['coachA', 'coach'],
  ['coachB', 'coach'],
  ['dirigeant', 'dirigeant'],
  ['member', 'member'],
  ['inactive', 'inactive'],
]) {
  const { data, error } = await clients[name].rpc('current_user_role')
  if (error || data !== expectedRole) {
    throw new Error(`${name}: rôle attendu ${expectedRole}, obtenu ${error?.message || String(data)}`)
  }
  process.stdout.write(`✓ ${name} OK\n`)
}

process.stdout.write('Comptes validés. Démarrage des tests de permissions.\n')

async function visibleById(client, table, id) {
  return client.from(table).select('id').eq('id', id)
}

async function expectVisible(client, table, id, message) {
  const { data, error } = await visibleById(client, table, id)
  check(!error && data?.length === 1, message, error?.message || `lignes=${data?.length}`)
}

async function expectHidden(client, table, id, message) {
  const { data, error } = await visibleById(client, table, id)
  check(!error && data?.length === 0, message, error?.message || `lignes=${data?.length}`)
}

for (const name of ['coachA', 'coachB', 'dirigeant', 'member', 'inactive']) {
  await expectHidden(clients[name], 'registration_requests', fixtures.registrationRequest, `${name}: demandes d'inscription invisibles`)
}

for (const name of ['admin', 'technicalManager']) {
  await expectVisible(clients[name], 'registration_requests', fixtures.registrationRequest, `${name}: demandes d'inscription accessibles`)
}

{
  await expectVisible(clients.admin, 'admin_notifications', fixtures.adminNotification, 'admin: notifications administratives accessibles')
  await expectVisible(clients.technicalManager, 'admin_notifications', fixtures.adminNotification, 'responsable technique: notifications administratives accessibles')
}

for (const name of ['coachA', 'coachB', 'dirigeant', 'member', 'inactive']) {
  await expectHidden(clients[name], 'admin_notifications', fixtures.adminNotification, `${name}: notifications administratives invisibles`)
}

for (const table of ['ai_expert_modes', 'document_ai_results', 'email_events']) {
  for (const name of ['admin', 'technicalManager']) {
    const { error } = await clients[name].from(table).select('*').limit(1)
    check(!error, `${name}: lecture autorisée de ${table}`, error?.message)
  }
  for (const name of ['dirigeant', 'member', 'inactive']) {
    const { data, error } = await clients[name].from(table).select('*').limit(1)
    check(!error && data?.length === 0, `${name}: lecture refusée de ${table}`, error?.message || `lignes=${data?.length}`)
  }
  for (const name of ['admin', 'coachA', 'member']) {
    const { error } = await clients[name].from(table).insert({ id: crypto.randomUUID() })
    check(error?.code === '42501', `${name}: écriture directe refusée dans ${table}`, error?.message)
  }
}

{
  const { data: authData } = await clients.inactive.auth.getUser()
  const { data, error } = await clients.inactive
    .from('profiles')
    .update({ is_active: true, profile_status: 'active' })
    .eq('id', authData.user?.id)
    .select('id')
  check(!error && data?.length === 0, 'profil inactif: auto-réactivation refusée', error?.message || `lignes=${data?.length}`)
}

{
  const { data: authData } = await clients.coachA.auth.getUser()
  const userId = authData.user?.id
  const { error } = await clients.coachA.from('profiles').update({ role: 'admin' }).eq('id', userId)
  check(Boolean(error), 'coach A: auto-promotion de rôle refusée', error?.message)
}

{
  const { data: memberAuth } = await clients.member.auth.getUser()
  const { data: coachAuth } = await clients.coachA.auth.getUser()
  await expectVisible(clients.member, 'profiles', memberAuth.user?.id, 'membre: son propre profil est visible')
  await expectHidden(clients.member, 'profiles', coachAuth.user?.id, 'membre: le profil du coach est invisible')
  const { error } = await clients.member.from('profiles').update({ role: 'admin' }).eq('id', memberAuth.user?.id)
  check(Boolean(error), 'membre: auto-promotion de rôle refusée', error?.message)
}

{
  const randomRequestId = crypto.randomUUID()
  const { error: coachError } = await clients.coachA.rpc('reject_profile_request', {
    request_id: randomRequestId,
    admin_note_value: 'test RLS',
  })
  check(
    coachError?.code === '42501',
    'coach A: RPC security definer refusée',
    formatPostgrestError(coachError),
  )

  const { error: adminError } = await clients.admin.rpc('reject_profile_request', {
    request_id: randomRequestId,
    admin_note_value: 'test RLS',
  })
  check(
    adminError?.code === 'PT404',
    'admin: RPC autorisée jusqu’au contrôle métier',
    formatPostgrestError(adminError),
  )

  const { error: approveAdminError } = await clients.admin.rpc('approve_profile_request', {
    request_id: randomRequestId,
    final_role: 'member',
    final_category_id: null,
    admin_note_value: 'test RLS',
  })
  check(
    approveAdminError?.code === 'PT404',
    'admin: approbation autorisée jusqu’au contrôle métier',
    formatPostgrestError(approveAdminError),
  )
}

const { teamA, teamB, playerA, playerB, contactA, contactB, sessionA, sessionB, situationA, situationB } = fixtures

for (const [name, expectedA, expectedB] of [
  ['admin', true, true],
  ['technicalManager', true, true],
  ['dirigeant', true, true],
  ['coachA', true, false],
  ['coachB', false, true],
  ['member', false, false],
  ['inactive', false, false],
]) {
  const { data: accessA, error: errorA } = await clients[name].rpc('can_access_team', { target_team_id: teamA })
  const { data: accessB, error: errorB } = await clients[name].rpc('can_access_team', { target_team_id: teamB })
  check(!errorA && accessA === expectedA, `${name}: can_access_team équipe A`, errorA?.message || String(accessA))
  check(!errorB && accessB === expectedB, `${name}: can_access_team équipe B`, errorB?.message || String(accessB))
}

for (const table of ['players', 'sessions', 'situations']) {
  const payload = table === 'players'
    ? { id: crypto.randomUUID(), first_name: 'Inter', last_name: 'Equipe', owner_id: fixtureState.accounts.coachA.id, created_by: fixtureState.accounts.coachA.id }
    : table === 'sessions'
      ? { id: crypto.randomUUID(), title: 'Écriture inter-équipe refusée', team_id: teamB, coach_id: fixtureState.accounts.coachA.id, owner_id: fixtureState.accounts.coachA.id }
      : { id: crypto.randomUUID(), title: 'Écriture inter-équipe refusée', team_id: teamB, owner_id: fixtureState.accounts.coachA.id, created_by: fixtureState.accounts.coachA.id }
  if (table === 'players') continue
  const { error } = await clients.coachA.from(table).insert(payload)
  check(error?.code === '42501', `coach A: insertion inter-équipe refusée dans ${table}`, error?.message)
}

await expectVisible(clients.coachA, 'teams', teamA, 'coach A: sa propre équipe est visible')
await expectHidden(clients.coachA, 'teams', teamB, 'coach A: équipe B invisible')
await expectHidden(clients.coachB, 'teams', teamA, 'coach B: équipe A invisible')
await expectVisible(clients.coachB, 'teams', teamB, 'coach B: sa propre équipe est visible')
await expectVisible(clients.dirigeant, 'teams', teamA, 'dirigeant: équipe A visible')
await expectVisible(clients.dirigeant, 'teams', teamB, 'dirigeant: équipe B visible')
await expectHidden(clients.member, 'teams', teamA, 'membre: équipe privée invisible')
await expectHidden(clients.inactive, 'teams', teamA, 'profil inactif: équipe invisible')

for (const [table, ownId, otherId] of [
  ['players', playerA, playerB],
  ['player_contacts', contactA, contactB],
  ['sessions', sessionA, sessionB],
  ['situations', situationA, situationB],
]) {
  await expectVisible(clients.coachA, table, ownId, `coach A: ${table} de son équipe visible`)
  await expectHidden(clients.coachA, table, otherId, `coach A: ${table} de l’équipe B invisible`)
  await expectHidden(clients.coachB, table, ownId, `coach B: ${table} de l’équipe A invisible`)
  await expectVisible(clients.coachB, table, otherId, `coach B: ${table} de son équipe visible`)
  await expectVisible(clients.dirigeant, table, ownId, `dirigeant: ${table} de l’équipe A visible`)
  await expectVisible(clients.dirigeant, table, otherId, `dirigeant: ${table} de l’équipe B visible`)
  await expectVisible(clients.admin, table, ownId, `admin: ${table} de l’équipe A visible`)
  await expectVisible(clients.admin, table, otherId, `admin: ${table} de l’équipe B visible`)
  await expectHidden(clients.member, table, ownId, `membre: ${table} sensible invisible`)
  await expectHidden(clients.inactive, table, ownId, `profil inactif: ${table} sensible invisible`)
}

{
  const { data, error } = await clients.coachA.from('teams').update({ updated_at: new Date().toISOString() }).eq('id', teamB).select('id')
  check(!error && data?.length === 0, 'coach A: modification de l’équipe B refusée', error?.message || `lignes=${data?.length}`)
}

{
  const { data, error } = await clients.member.from('players').update({ updated_at: new Date().toISOString() }).eq('id', playerA).select('id')
  check(!error && data?.length === 0, 'membre: modification d’un joueur refusée', error?.message || `lignes=${data?.length}`)
}

{
  const { data, error } = await clients.admin.rpc('list_teams_without_active_staff')
  check(!error && Array.isArray(data), 'admin: équipes sans staff identifiables', error?.message)
  const { error: memberError } = await clients.member.rpc('list_teams_without_active_staff')
  check(memberError?.code === '42501', 'membre: diagnostic équipes sans staff refusé', memberError?.message)
}

await Promise.all(Object.values(clients).map((client) => client.auth.signOut()))

if (failures) {
  throw new Error(`${failures} contrôle(s) RLS en échec.`)
}

process.stdout.write('Tous les contrôles RLS configurés sont passés.\n')
