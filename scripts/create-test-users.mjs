import { randomBytes } from 'node:crypto'
import { chmod, writeFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'
import { assertSafeTestEnvironment, fixtureFile, loadFixtureState, loadLocalEnv } from './rls-test-config.mjs'

const config = await loadLocalEnv()
const projectRef = assertSafeTestEnvironment(config, { operation: 'création des fixtures RLS', requireServiceRole: true })

const adminClient = createClient(config.url, config.serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const definitions = {
  admin: { email: 'rls.admin@bcvb.test', role: 'admin', active: true, name: 'RLS Admin' },
  coachA: { email: 'rls.coach-a@bcvb.test', role: 'coach', active: true, name: 'RLS Coach A' },
  coachB: { email: 'rls.coach-b@bcvb.test', role: 'coach', active: true, name: 'RLS Coach B' },
  dirigeant: { email: 'rls.dirigeant@bcvb.test', role: 'dirigeant', active: true, name: 'RLS Dirigeant' },
  technicalManager: { email: 'rls.responsable-technique@bcvb.test', role: 'responsable_technique', active: true, name: 'RLS Responsable technique' },
  member: { email: 'rls.member@bcvb.test', role: 'member', active: true, name: 'RLS Membre' },
  inactive: { email: 'rls.inactive@bcvb.test', role: 'coach', active: false, name: 'RLS Inactif' },
}

const ids = {
  teamA: '10000000-0000-4000-8000-000000000001',
  teamB: '10000000-0000-4000-8000-000000000002',
  playerA: '20000000-0000-4000-8000-000000000001',
  playerA2: '20000000-0000-4000-8000-000000000002',
  playerB: '20000000-0000-4000-8000-000000000003',
  playerB2: '20000000-0000-4000-8000-000000000004',
  membershipA: '30000000-0000-4000-8000-000000000001',
  membershipA2: '30000000-0000-4000-8000-000000000002',
  membershipB: '30000000-0000-4000-8000-000000000003',
  membershipB2: '30000000-0000-4000-8000-000000000004',
  contactA: '40000000-0000-4000-8000-000000000001',
  contactB: '40000000-0000-4000-8000-000000000002',
  sessionA: '50000000-0000-4000-8000-000000000001',
  sessionB: '50000000-0000-4000-8000-000000000002',
  situationA: '60000000-0000-4000-8000-000000000001',
  situationB: '60000000-0000-4000-8000-000000000002',
  registrationRequest: '70000000-0000-4000-8000-000000000002',
  adminNotification: '80000000-0000-4000-8000-000000000002',
}

const previousState = await loadFixtureState()

function newPassword() {
  return `Rls-${randomBytes(24).toString('base64url')}!9a`
}

async function listAllUsers() {
  const users = []
  for (let page = 1; ; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(`Lecture auth.users impossible : ${error.message}`)
    users.push(...data.users)
    if (data.users.length < 1000) return users
  }
}

async function upsertRows(table, rows, onConflict = 'id') {
  const { error } = await adminClient.from(table).upsert(rows, { onConflict })
  if (error) throw new Error(`${table}: ${error.message}`)
}

const existingUsers = await listAllUsers()
const existingByEmail = new Map(existingUsers.map((user) => [user.email?.toLowerCase(), user]))
const accounts = {}

for (const [name, definition] of Object.entries(definitions)) {
  const password = previousState?.accounts?.[name]?.password || newPassword()
  const existing = existingByEmail.get(definition.email)
  let user

  if (existing) {
    const { data, error } = await adminClient.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: definition.name, role: definition.role, rls_test: true },
      app_metadata: { role: definition.role, rls_test: true },
    })
    if (error) throw new Error(`${name}: mise à jour Auth impossible : ${error.message}`)
    user = data.user
  } else {
    const { data, error } = await adminClient.auth.admin.createUser({
      email: definition.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: definition.name, role: definition.role, rls_test: true },
      app_metadata: { role: definition.role, rls_test: true },
    })
    if (error || !data.user) throw new Error(`${name}: création Auth impossible : ${error?.message || 'utilisateur absent'}`)
    user = data.user
  }

  accounts[name] = { id: user.id, email: definition.email, password, role: definition.active ? definition.role : 'inactive' }
}

await upsertRows('profiles', Object.entries(definitions).map(([name, definition]) => ({
  id: accounts[name].id,
  email: definition.email,
  full_name: definition.name,
  role: definition.role,
  is_active: definition.active,
  profile_status: definition.active ? 'active' : 'inactive',
})))

// Les tests transactionnels remplacent volontairement les coachs de ces deux
// équipes réservées. Remet le staff actif à zéro pour rendre le seed idempotent,
// tout en conservant les lignes historiques inactives.
{
  const { error } = await adminClient
    .from('team_staff_assignments')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .in('team_id', [ids.teamA, ids.teamB])
    .eq('is_active', true)
  if (error) throw new Error(`team_staff_assignments reset fixtures: ${error.message}`)
}

await upsertRows('teams', [
  {
    id: ids.teamA,
    name: 'RLS Team A',
    category: 'U13',
    level: 'Test',
    season: 'RLS-TEST',
    head_coach_id: accounts.coachA.id,
    assistant_coach_ids: [],
    created_by: accounts.admin.id,
    archived_at: null,
  },
  {
    id: ids.teamB,
    name: 'RLS Team B',
    category: 'U15',
    level: 'Test',
    season: 'RLS-TEST',
    head_coach_id: accounts.coachB.id,
    assistant_coach_ids: [],
    created_by: accounts.admin.id,
    archived_at: null,
  },
])

await upsertRows('team_staff_assignments', [
  { team_id: ids.teamA, profile_id: accounts.coachA.id, assignment_role: 'head_coach', is_active: true, created_by: accounts.admin.id },
  { team_id: ids.teamB, profile_id: accounts.coachB.id, assignment_role: 'head_coach', is_active: true, created_by: accounts.admin.id },
], 'team_id,profile_id,assignment_role')

await upsertRows('players', [
  { id: ids.playerA, first_name: 'Alice', last_name: 'RLS A', category: 'U13', owner_id: accounts.coachA.id, created_by: accounts.coachA.id, archived_at: null, deleted_at: null },
  { id: ids.playerA2, first_name: 'Arthur', last_name: 'RLS A', category: 'U13', owner_id: accounts.coachA.id, created_by: accounts.coachA.id, archived_at: null, deleted_at: null },
  { id: ids.playerB, first_name: 'Binta', last_name: 'RLS B', category: 'U15', owner_id: accounts.coachB.id, created_by: accounts.coachB.id, archived_at: null, deleted_at: null },
  { id: ids.playerB2, first_name: 'Basile', last_name: 'RLS B', category: 'U15', owner_id: accounts.coachB.id, created_by: accounts.coachB.id, archived_at: null, deleted_at: null },
])

await upsertRows('team_memberships', [
  { id: ids.membershipA, player_id: ids.playerA, team_id: ids.teamA, season: 'RLS-TEST', status: 'active', created_by: accounts.admin.id },
  { id: ids.membershipA2, player_id: ids.playerA2, team_id: ids.teamA, season: 'RLS-TEST', status: 'active', created_by: accounts.admin.id },
  { id: ids.membershipB, player_id: ids.playerB, team_id: ids.teamB, season: 'RLS-TEST', status: 'active', created_by: accounts.admin.id },
  { id: ids.membershipB2, player_id: ids.playerB2, team_id: ids.teamB, season: 'RLS-TEST', status: 'active', created_by: accounts.admin.id },
])

await upsertRows('player_contacts', [
  { id: ids.contactA, player_id: ids.playerA, parent_1_name: 'Contact RLS A', parent_1_email: 'contact-a@bcvb.test', visibility: 'team_staff', created_by: accounts.admin.id },
  { id: ids.contactB, player_id: ids.playerB, parent_1_name: 'Contact RLS B', parent_1_email: 'contact-b@bcvb.test', visibility: 'team_staff', created_by: accounts.admin.id },
])

await upsertRows('sessions', [
  { id: ids.sessionA, title: 'Séance privée RLS A', category: 'U13', team_id: ids.teamA, coach_id: accounts.coachA.id, owner_id: accounts.coachA.id, visibility: 'private', status: 'draft' },
  { id: ids.sessionB, title: 'Séance privée RLS B', category: 'U15', team_id: ids.teamB, coach_id: accounts.coachB.id, owner_id: accounts.coachB.id, visibility: 'private', status: 'draft' },
])

await upsertRows('situations', [
  { id: ids.situationA, session_id: ids.sessionA, team_id: ids.teamA, title: 'Situation privée RLS A', category: 'U13', owner_id: accounts.coachA.id, created_by: accounts.coachA.id, visibility: 'private', status: 'draft' },
  { id: ids.situationB, session_id: ids.sessionB, team_id: ids.teamB, title: 'Situation privée RLS B', category: 'U15', owner_id: accounts.coachB.id, created_by: accounts.coachB.id, visibility: 'private', status: 'draft' },
])

await upsertRows('registration_requests', [{
  id: ids.registrationRequest,
  first_name: 'Fixture',
  last_name: 'RLS',
  email: 'rls.fixture-request@bcvb.test',
  role_requested: 'member',
  status: 'pending',
  notification_sent_at: null,
}])

await upsertRows('admin_notifications', [{
  id: ids.adminNotification,
  type: 'rls_fixture',
  title: 'Fixture de sécurité RLS',
  message: 'Cette notification garantit que les tests de non-visibilité ne passent pas sur une table vide.',
  recipient_role: 'admin',
  metadata: { rls_test: true, registration_request_id: ids.registrationRequest },
}])

const state = {
  version: 2,
  generatedAt: new Date().toISOString(),
  target: { environment: config.environment, projectName: config.projectName, projectRef, url: config.url },
  accounts,
  fixtures: {
    teamA: ids.teamA,
    teamB: ids.teamB,
    playerA: ids.playerA,
    playerB: ids.playerB,
    contactA: ids.contactA,
    contactB: ids.contactB,
    sessionA: ids.sessionA,
    sessionB: ids.sessionB,
    situationA: ids.situationA,
    situationB: ids.situationB,
    registrationRequest: ids.registrationRequest,
    adminNotification: ids.adminNotification,
  },
}

await writeFile(fixtureFile, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 })
await chmod(fixtureFile, 0o600)

for (const name of Object.keys(definitions)) process.stdout.write(`✓ ${name}: ${accounts[name].id} (${accounts[name].email})\n`)
for (const [name, id] of Object.entries(ids)) process.stdout.write(`✓ ${name}: ${id}\n`)
process.stdout.write('✓ Team A, Team B, affectations, joueurs, contacts, séances et situations prêts\n')
process.stdout.write(`✓ Fixtures enregistrées localement dans ${fixtureFile}\n`)
