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
  coachSameTeam: { email: 'rls.coach-a2@bcvb.test', role: 'coach', active: true, name: 'RLS Coach A2' },
  coachB: { email: 'rls.coach-b@bcvb.test', role: 'coach', active: true, name: 'RLS Coach B' },
  coachParentOnly: { email: 'rls.coach-parent-only@bcvb.test', role: 'coach', active: true, name: 'RLS Coach parent only' },
  coachTeamStaffOnly: { email: 'rls.coach-team-staff-only@bcvb.test', role: 'coach', active: true, name: 'RLS Coach staff only' },
  teamStaff: { email: 'rls.team-staff@bcvb.test', role: 'team_staff', active: true, name: 'RLS Staff équipe' },
  parentReferent: { email: 'rls.parent-referent@bcvb.test', role: 'parent_referent', active: true, name: 'RLS Parent référent' },
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
  sessionPublishedA: '50000000-0000-4000-8000-000000000003',
  sessionArchivedA: '50000000-0000-4000-8000-000000000004',
  sessionRichA: '50000000-0000-4000-8000-000000000005',
  sessionDeletedA: '50000000-0000-4000-8000-000000000006',
  situationA: '60000000-0000-4000-8000-000000000001',
  situationB: '60000000-0000-4000-8000-000000000002',
  situationPublishedA: '60000000-0000-4000-8000-000000000003',
  situationArchivedA: '60000000-0000-4000-8000-000000000004',
  sessionSituationA: '61000000-0000-4000-8000-000000000001',
  sessionTagA: '62000000-0000-4000-8000-000000000001',
  situationTagA: '63000000-0000-4000-8000-000000000001',
  richBlockFirst: '61000000-0000-4000-8000-000000000011',
  richBlockSecond: '61000000-0000-4000-8000-000000000012',
  registrationRequest: '70000000-0000-4000-8000-000000000002',
  adminNotification: '80000000-0000-4000-8000-000000000002',
  attendanceSessionA: '90000000-0000-4000-8000-000000000001',
  attendanceSessionB: '90000000-0000-4000-8000-000000000002',
  attendanceRecordA: '91000000-0000-4000-8000-000000000001',
  attendanceRecordB: '91000000-0000-4000-8000-000000000002',
  attendanceSlotSeasonMismatch: '92000000-0000-4000-8000-000000000001',
  attendanceSlotCancelled: '92000000-0000-4000-8000-000000000002',
  attendanceSlotStart: '92000000-0000-4000-8000-000000000003',
  attendanceSlotEnd: '92000000-0000-4000-8000-000000000004',
  attendanceSlotLocation: '92000000-0000-4000-8000-000000000005',
  attendanceSlotCombined: '92000000-0000-4000-8000-000000000006',
  attendanceSlotMoved: '92000000-0000-4000-8000-000000000007',
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
  { team_id: ids.teamA, profile_id: accounts.coachSameTeam.id, assignment_role: 'assistant_coach', is_active: true, created_by: accounts.admin.id },
  { team_id: ids.teamB, profile_id: accounts.coachB.id, assignment_role: 'head_coach', is_active: true, created_by: accounts.admin.id },
  { team_id: ids.teamA, profile_id: accounts.coachParentOnly.id, assignment_role: 'parent_referent', is_active: true, created_by: accounts.admin.id },
  { team_id: ids.teamA, profile_id: accounts.coachTeamStaffOnly.id, assignment_role: 'team_staff', is_active: true, created_by: accounts.admin.id },
  { team_id: ids.teamA, profile_id: accounts.teamStaff.id, assignment_role: 'team_staff', is_active: true, created_by: accounts.admin.id },
  { team_id: ids.teamA, profile_id: accounts.parentReferent.id, assignment_role: 'parent_referent', is_active: true, created_by: accounts.admin.id },
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
  { id: ids.sessionPublishedA, title: 'Séance publiée RLS A', category: 'U13', team_id: ids.teamA, coach_id: accounts.coachA.id, owner_id: accounts.coachA.id, visibility: 'club', status: 'published' },
  { id: ids.sessionArchivedA, title: 'Séance archivée RLS A', category: 'U13', team_id: ids.teamA, coach_id: accounts.coachA.id, owner_id: accounts.coachA.id, visibility: 'private', status: 'archived' },
])
await upsertRows('sessions', [
  { id: ids.sessionRichA, title: 'Fixture riche lecture Supabase', category: 'U15', level: 'confirmé', theme: 'Passe', sub_theme: 'Fixation-passe', team_id: ids.teamA, coach_id: accounts.coachA.id, owner_id: accounts.coachA.id, visibility: 'club', status: 'published', duration_minutes: 30, expected_players: 8, quality_score: 84, version: 7, content_json: { objectives: ['Objectif de test explicitement défini'], equipment: ['Matériel de test'], intensityLevel: 'high', notes: 'Notes de fixture', metricsSummary: [{ id: 'metric-server-1', label: 'Mesure fixture', type: 'count', target: '5', observed: '', unit: '', notes: '' }] } },
])
await upsertRows('sessions', [
  { id: ids.sessionDeletedA, title: 'Fixture soft deleted', category: 'U15', team_id: ids.teamA, coach_id: accounts.coachA.id, owner_id: accounts.coachA.id, visibility: 'club', status: 'archived', deleted_at: '2026-08-01T00:00:00Z' },
])

await upsertRows('situations', [
  { id: ids.situationA, session_id: ids.sessionA, team_id: ids.teamA, title: 'Situation privée RLS A', category: 'U13', owner_id: accounts.coachA.id, created_by: accounts.coachA.id, visibility: 'private', status: 'draft' },
  { id: ids.situationB, session_id: ids.sessionB, team_id: ids.teamB, title: 'Situation privée RLS B', category: 'U15', owner_id: accounts.coachB.id, created_by: accounts.coachB.id, visibility: 'private', status: 'draft' },
  { id: ids.situationPublishedA, team_id: ids.teamA, title: 'Situation publiée RLS A', category: 'U13', owner_id: accounts.coachA.id, created_by: accounts.coachA.id, visibility: 'club', status: 'published' },
  { id: ids.situationArchivedA, team_id: ids.teamA, title: 'Situation archivée RLS A', category: 'U13', owner_id: accounts.coachA.id, created_by: accounts.coachA.id, visibility: 'private', status: 'archived' },
])

await upsertRows('session_situations', [
  { id: ids.sessionSituationA, session_id: ids.sessionA, order_index: 1, title: 'Bloc privé RLS A' },
])
await upsertRows('session_situations', [
  { id: ids.richBlockFirst, session_id: ids.sessionRichA, order_index: 1, title: 'Bloc riche premier', duration_minutes: 10, theme: 'Passe', sub_theme: 'Fixation-passe', content_json: { objective: 'Objectif premier bloc fixture', courtFrames: [{ id: 'court-server-1', title: 'Terrain fixture', courtType: 'half', intent: 'Test', objects: [{ id: 'attack-server-1', type: 'offense_player', x: 1, y: 2, label: 'A' }, { id: 'defense-server-1', type: 'defense_player', x: 3, y: 4, label: 'D' }, { id: 'ball-server-1', type: 'ball', x: 2, y: 2, label: 'B' }], arrows: [{ id: 'arrow-server-1', type: 'arrow_dribble', fromX: 1, fromY: 2, toX: 3, toY: 4 }], zones: [], notes: '' }], metrics: [{ id: 'metric-block-1', label: 'Fixture' }], commonMistakes: ['Erreur fixture'], coachCorrections: ['Correction fixture'], matchTransfer: 'Transfert fixture' } },
  { id: ids.richBlockSecond, session_id: ids.sessionRichA, order_index: 2, title: 'Bloc riche second', duration_minutes: 20, theme: 'Passe', sub_theme: 'Fixation-passe', content_json: { objective: 'Objectif second bloc fixture' } },
])
await upsertRows('session_tags', [
  { id: ids.sessionTagA, session_id: ids.sessionA, tag: 'rls-session-a' },
  { id: '62000000-0000-4000-8000-000000000011', session_id: ids.sessionRichA, tag: 'fixture-rich' },
  { id: '62000000-0000-4000-8000-000000000012', session_id: ids.sessionRichA, tag: 'fixture-read' },
])
await upsertRows('situation_tags', [
  { id: ids.situationTagA, situation_id: ids.situationA, tag: 'rls-situation-a' },
])

await upsertRows('attendance_sessions', [
  {
    id: ids.attendanceSessionA,
    team_id: ids.teamA,
    session_date: '2026-08-20',
    title: 'Appel Team A',
    session_type: 'entrainement',
    status: 'draft',
    created_by: accounts.admin.id,
  },
  {
    id: ids.attendanceSessionB,
    team_id: ids.teamB,
    session_date: '2026-08-20',
    title: 'Appel Team B',
    session_type: 'entrainement',
    status: 'draft',
    created_by: accounts.admin.id,
  },
])

const attendanceContractSlotIds = [
  ids.attendanceSlotSeasonMismatch, ids.attendanceSlotCancelled, ids.attendanceSlotStart,
  ids.attendanceSlotEnd, ids.attendanceSlotLocation, ids.attendanceSlotCombined, ids.attendanceSlotMoved,
]
const { data: staleContractSessions, error: staleContractReadError } = await adminClient
  .from('attendance_sessions').select('id').in('training_slot_id', attendanceContractSlotIds)
if (staleContractReadError) throw new Error(`attendance contract cleanup read: ${staleContractReadError.message}`)
if (staleContractSessions?.length) {
  const staleIds = staleContractSessions.map((row) => row.id)
  const { error: staleRecordsError } = await adminClient.from('attendance_records').delete().in('session_id', staleIds)
  if (staleRecordsError) throw new Error(`attendance contract records cleanup: ${staleRecordsError.message}`)
  const { error: staleSessionsError } = await adminClient.from('attendance_sessions').delete().in('id', staleIds)
  if (staleSessionsError) throw new Error(`attendance contract sessions cleanup: ${staleSessionsError.message}`)
}

await upsertRows('training_slots', [
  { id: ids.attendanceSlotSeasonMismatch, team_id: ids.teamA, season: 'OTHER-SEASON', weekday: 3, start_time: '20:30', end_time: '22:00', location_name: 'Saison RLS', valid_from: '2035-01-01', is_active: true, created_by: accounts.admin.id },
  { id: ids.attendanceSlotCancelled, team_id: ids.teamA, season: 'RLS-TEST', weekday: 3, start_time: '20:30', end_time: '22:00', location_name: 'Annulation RLS', valid_from: '2035-01-01', is_active: true, created_by: accounts.admin.id },
  { id: ids.attendanceSlotStart, team_id: ids.teamA, season: 'RLS-TEST', weekday: 3, start_time: '20:30', end_time: '22:00', location_name: 'Début RLS', valid_from: '2035-01-01', is_active: true, created_by: accounts.admin.id },
  { id: ids.attendanceSlotEnd, team_id: ids.teamA, season: 'RLS-TEST', weekday: 3, start_time: '20:30', end_time: '22:00', location_name: 'Fin RLS', valid_from: '2035-01-01', is_active: true, created_by: accounts.admin.id },
  { id: ids.attendanceSlotLocation, team_id: ids.teamA, season: 'RLS-TEST', weekday: 3, start_time: '20:30', end_time: '22:00', location_name: 'Lieu RLS', valid_from: '2035-01-01', is_active: true, created_by: accounts.admin.id },
  { id: ids.attendanceSlotCombined, team_id: ids.teamA, season: 'RLS-TEST', weekday: 3, start_time: '20:30', end_time: '22:00', location_name: 'Combiné RLS', valid_from: '2035-01-01', is_active: true, created_by: accounts.admin.id },
  { id: ids.attendanceSlotMoved, team_id: ids.teamA, season: 'RLS-TEST', weekday: 3, start_time: '20:30', end_time: '22:00', location_name: 'Moved RLS', valid_from: '2035-01-01', is_active: true, created_by: accounts.admin.id },
])
await upsertRows('training_slot_exceptions', [
  { id: '93000000-0000-4000-8000-000000000002', training_slot_id: ids.attendanceSlotCancelled, exception_date: '2035-01-10', exception_type: 'cancelled', start_time: '18:00', end_time: '19:00', location_name: 'Ne doit pas ressusciter', created_by: accounts.admin.id },
  { id: '93000000-0000-4000-8000-000000000003', training_slot_id: ids.attendanceSlotStart, exception_date: '2035-01-17', exception_type: 'modified', start_time: '19:30', created_by: accounts.admin.id },
  { id: '93000000-0000-4000-8000-000000000004', training_slot_id: ids.attendanceSlotEnd, exception_date: '2035-01-24', exception_type: 'modified', end_time: '22:30', created_by: accounts.admin.id },
  { id: '93000000-0000-4000-8000-000000000005', training_slot_id: ids.attendanceSlotLocation, exception_date: '2035-01-31', exception_type: 'modified', location_name: '  Annexe RLS  ', created_by: accounts.admin.id },
  { id: '93000000-0000-4000-8000-000000000006', training_slot_id: ids.attendanceSlotCombined, exception_date: '2035-02-07', exception_type: 'modified', start_time: '19:00', end_time: '21:00', location_name: 'Combiné effectif', created_by: accounts.admin.id },
  { id: '93000000-0000-4000-8000-000000000007', training_slot_id: ids.attendanceSlotMoved, exception_date: '2035-02-14', exception_type: 'moved', start_time: '18:30', end_time: '20:00', location_name: 'Moved effectif', created_by: accounts.admin.id },
])

const { error: attendanceCleanupError } = await adminClient
  .from('attendance_records')
  .delete()
  .in('session_id', [ids.attendanceSessionA, ids.attendanceSessionB])

if (attendanceCleanupError) {
  throw new Error(`attendance_records cleanup: ${attendanceCleanupError.message}`)
}

const { error: attendanceInsertError } = await adminClient
  .from('attendance_records')
  .insert([
    {
      id: ids.attendanceRecordA,
      session_id: ids.attendanceSessionA,
      player_id: ids.playerA,
      status: 'present',
      source: 'admin',
      parent_confirmed: false,
      validated_by_coach: false,
      created_by: accounts.admin.id,
    },
    {
      id: ids.attendanceRecordB,
      session_id: ids.attendanceSessionB,
      player_id: ids.playerB,
      status: 'present',
      source: 'admin',
      parent_confirmed: false,
      validated_by_coach: false,
      created_by: accounts.admin.id,
    },
  ])

if (attendanceInsertError) {
  throw new Error(`attendance_records fixtures: ${attendanceInsertError.message}`)
}

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
    playerA2: ids.playerA2,
    playerB: ids.playerB,
    playerB2: ids.playerB2,
    contactA: ids.contactA,
    contactB: ids.contactB,
    sessionA: ids.sessionA,
    sessionB: ids.sessionB,
    sessionPublishedA: ids.sessionPublishedA,
    sessionArchivedA: ids.sessionArchivedA,
    sessionRichA: ids.sessionRichA,
    sessionDeletedA: ids.sessionDeletedA,
    situationA: ids.situationA,
    situationB: ids.situationB,
    situationPublishedA: ids.situationPublishedA,
    situationArchivedA: ids.situationArchivedA,
    sessionSituationA: ids.sessionSituationA,
    sessionTagA: ids.sessionTagA,
    situationTagA: ids.situationTagA,
    richBlockFirst: ids.richBlockFirst,
    richBlockSecond: ids.richBlockSecond,
    attendanceSessionA: ids.attendanceSessionA,
    attendanceSessionB: ids.attendanceSessionB,
    attendanceRecordA: ids.attendanceRecordA,
    attendanceRecordB: ids.attendanceRecordB,
    attendanceSlotSeasonMismatch: ids.attendanceSlotSeasonMismatch,
    attendanceSlotCancelled: ids.attendanceSlotCancelled,
    attendanceSlotStart: ids.attendanceSlotStart,
    attendanceSlotEnd: ids.attendanceSlotEnd,
    attendanceSlotLocation: ids.attendanceSlotLocation,
    attendanceSlotCombined: ids.attendanceSlotCombined,
    attendanceSlotMoved: ids.attendanceSlotMoved,
    registrationRequest: ids.registrationRequest,
    adminNotification: ids.adminNotification,
  },
}

await writeFile(fixtureFile, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 })
await chmod(fixtureFile, 0o600)

for (const name of Object.keys(definitions)) process.stdout.write(`✓ ${name}: ${accounts[name].id} (${accounts[name].email})\n`)
for (const [name, id] of Object.entries(ids)) process.stdout.write(`✓ ${name}: ${id}\n`)
process.stdout.write('✓ Team A, Team B, affectations, joueurs, contacts, séances, situations et présences prêts\n')
process.stdout.write(`✓ Fixtures enregistrées localement dans ${fixtureFile}\n`)
