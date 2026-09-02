import { createClient } from '@supabase/supabase-js'
import { execFileSync } from 'node:child_process'
import { assertSafeTestEnvironment, loadFixtureState, loadLocalEnv } from './rls-test-config.mjs'

const config = await loadLocalEnv()
assertSafeTestEnvironment(config, { operation: 'test local de l’import RF3', requireServiceRole: true })

const fixtureState = await loadFixtureState()
if (!fixtureState?.accounts?.admin || !fixtureState?.accounts?.coachA) {
  throw new Error('Fixtures RLS admin/coach absentes. Exécuter npm run seed:rls.')
}

const service = createClient(config.url, config.serviceRoleKey, { auth: { persistSession: false } })
const anon = createClient(config.url, config.anonKey, { auth: { persistSession: false } })

async function signedIn(account) {
  const client = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { error } = await client.auth.signInWithPassword({ email: account.email, password: account.password })
  if (error) throw new Error(`Connexion fixture impossible : ${error.message}`)
  return client
}

const admin = await signedIn(fixtureState.accounts.admin)
const coach = await signedIn(fixtureState.accounts.coachA)
const adminId = fixtureState.accounts.admin.id
const coachId = fixtureState.accounts.coachA.id
const licenses = ['VT052472', 'VT986831', 'VT026946', 'VT054548', 'VT050954', 'VT025564', 'VT031276']

function assert(condition, message, detail = '') {
  if (!condition) throw new Error(`${message}${detail ? ` — ${detail}` : ''}`)
  process.stdout.write(`PASS ${message}${detail ? ` — ${detail}` : ''}\n`)
}

async function must(resultPromise, label) {
  const result = await resultPromise
  if (result.error) throw new Error(`${label}: ${result.error.message}`)
  return result.data
}

const databaseContainer = execFileSync('docker', ['ps', '--filter', 'name=supabase_db_', '--format', '{{.Names}}'], { encoding: 'utf8' })
  .split('\n').find((name) => name.includes('bcvb-generator'))
if (!databaseContainer) throw new Error('Conteneur PostgreSQL Supabase local introuvable pour le nettoyage RF3.')
function deleteLocalMemberships(teamIds) {
  if (!teamIds.length) return
  const quotedIds = teamIds.map((id) => `'${id}'`).join(',')
  execFileSync('docker', [
    'exec', databaseContainer, 'psql', '-U', 'postgres', '-d', 'postgres',
    '-X', '-v', 'ON_ERROR_STOP=1', '-c', `delete from public.team_memberships where team_id in (${quotedIds});`,
  ], { encoding: 'utf8' })
}

async function cleanupRf3() {
  const teams = await must(service.from('teams').select('id').eq('name', 'RF3 - SF').eq('season', '2026-2027'), 'lecture équipes RF3')
  const teamIds = teams.map((row) => row.id)
  if (teamIds.length) {
    await must(service.from('team_staff_assignments').delete().in('team_id', teamIds), 'nettoyage staff RF3')
    deleteLocalMemberships(teamIds)
    await must(service.from('teams').delete().in('id', teamIds), 'nettoyage équipes RF3')
  }
  await must(service.from('players').delete().in('license_number', licenses), 'nettoyage joueuses RF3')
}

async function scopedCounts() {
  const [teams, players, memberships, staff] = await Promise.all([
    service.from('teams').select('id', { count: 'exact', head: true }).eq('name', 'RF3 - SF').eq('season', '2026-2027'),
    service.from('players').select('id', { count: 'exact', head: true }).in('license_number', licenses),
    service.from('team_memberships').select('id,team:teams!inner(name,season)', { count: 'exact', head: true }).eq('season', '2026-2027').eq('team.name', 'RF3 - SF'),
    service.from('team_staff_assignments').select('id,team:teams!inner(name,season)', { count: 'exact', head: true }).eq('assignment_role', 'head_coach').eq('team.name', 'RF3 - SF').eq('team.season', '2026-2027'),
  ])
  for (const [label, result] of Object.entries({ teams, players, memberships, staff })) {
    if (result.error) throw new Error(`compteur ${label}: ${result.error.message}`)
  }
  return { teams: teams.count, players: players.count, memberships: memberships.count, staff: staff.count }
}

async function expectEmpty(label) {
  const counts = await scopedCounts()
  assert(Object.values(counts).every((count) => count === 0), label, JSON.stringify(counts))
}

await cleanupRf3()
await must(service.from('profiles').update({ full_name: 'Kevin TSHEFU' }).eq('id', adminId), 'préparation profil Kevin local')

const { error: anonError } = await anon.rpc('import_rf3_pilot_2026_2027')
assert(anonError?.code === '42501', 'anon: EXECUTE import RF3 refusé', anonError?.code)

const { error: serviceRoleError } = await service.rpc('import_rf3_pilot_2026_2027')
assert(serviceRoleError?.code === '42501', 'service_role: EXECUTE import RF3 non accordé', serviceRoleError?.code)

const { error: coachError } = await coach.rpc('import_rf3_pilot_2026_2027')
assert(coachError?.code === '42501', 'coach: import RF3 refusé par le contrôle Admin', coachError?.code)
await expectEmpty('refus non autorisés sans création')

await must(service.from('profiles').update({ full_name: 'RLS Admin sans correspondance RF3' }).eq('id', adminId), 'simulation Kevin absent')
const { error: missingKevinError } = await admin.rpc('import_rf3_pilot_2026_2027')
assert(missingKevinError?.code === '22023', 'Kevin absent: import refusé', missingKevinError?.code)
await expectEmpty('Kevin absent: rollback complet')
await must(service.from('profiles').update({ full_name: 'Kevin TSHEFU' }).eq('id', adminId), 'restauration Kevin')

await must(service.from('profiles').update({ full_name: 'Kevin TSHEFU' }).eq('id', coachId), 'simulation Kevin ambigu')
const { error: ambiguousKevinError } = await admin.rpc('import_rf3_pilot_2026_2027')
assert(ambiguousKevinError?.code === '22023', 'Kevin ambigu: import refusé', ambiguousKevinError?.code)
await expectEmpty('Kevin ambigu: rollback complet')
await must(service.from('profiles').update({ full_name: 'RLS Coach A' }).eq('id', coachId), 'restauration second profil')

const firstDuplicateTeam = await must(service.from('teams').insert(
  { name: 'RF3 - SF', category: 'Seniors', level: 'RF3', season: '2026-2027', created_by: adminId },
).select('id').single(), 'préparation protection doublon équipe')
const { error: duplicateInsertError } = await service.from('teams').insert(
  { name: ' rf3  -  sf ', category: ' seniors ', level: 'rf3', season: '2026-2027', created_by: adminId },
)
assert(duplicateInsertError?.code === '23505', 'équipes dupliquées normalisées: filet DB refuse la seconde ligne', duplicateInsertError?.code)
const duplicateProtectionCounts = await scopedCounts()
assert(duplicateProtectionCounts.teams === 1 && duplicateProtectionCounts.players === 0 && duplicateProtectionCounts.memberships === 0 && duplicateProtectionCounts.staff === 0, 'protection doublon: une seule équipe et aucune création partielle', JSON.stringify(duplicateProtectionCounts))
await must(service.from('teams').delete().eq('id', firstDuplicateTeam.id), 'nettoyage équipe du test de doublon')

await must(service.from('players').insert({ first_name: 'Conflit', last_name: 'Licence', birth_date: '2000-01-01', category: 'Seniors', license_number: 'VT052472', created_by: adminId }), 'simulation conflit licence')
const { error: licenseConflictError } = await admin.rpc('import_rf3_pilot_2026_2027')
assert(licenseConflictError?.code === '22023', 'licence incompatible: import refusé', licenseConflictError?.code)
const conflictCounts = await scopedCounts()
assert(conflictCounts.teams === 0 && conflictCounts.players === 1 && conflictCounts.memberships === 0 && conflictCounts.staff === 0, 'licence incompatible: rollback complet', JSON.stringify(conflictCounts))
await must(service.from('players').delete().eq('license_number', 'VT052472'), 'nettoyage conflit licence')

const setupTeam = await must(service.from('teams').insert({ name: 'RF3 - SF', category: 'Seniors', level: 'RF3', season: '2026-2027', created_by: adminId }).select('id').single(), 'préparation conflit membership équipe')
const setupPlayer = await must(service.from('players').insert({ first_name: 'Chiara', last_name: 'DELGADO', birth_date: '2005-01-21', category: 'Seniors', license_number: 'VT052472', created_by: adminId }).select('id').single(), 'préparation conflit membership joueuse')
const setupMembership = await must(admin.rpc('add_or_reactivate_team_membership', {
  target_player_id: setupPlayer.id,
  target_team_id: setupTeam.id,
  target_season: '2026-2027',
}), 'préparation membership incompatible')
await must(admin.rpc('deactivate_team_membership', { target_membership_id: setupMembership?.[0]?.membership_id }), 'désactivation membership incompatible')
const { error: membershipError } = await admin.rpc('import_rf3_pilot_2026_2027')
assert(membershipError?.code === '22023', 'membership incompatible: import refusé', membershipError?.code)
const membershipRollbackCounts = await scopedCounts()
assert(membershipRollbackCounts.teams === 1 && membershipRollbackCounts.players === 1 && membershipRollbackCounts.memberships === 1 && membershipRollbackCounts.staff === 0, 'membership incompatible: aucune création partielle', JSON.stringify(membershipRollbackCounts))
await cleanupRf3()

const { data: firstRun, error: firstRunError } = await admin.rpc('import_rf3_pilot_2026_2027')
assert(!firstRunError, 'Admin: premier import réussi', firstRunError?.message)
assert(firstRun?.status === 'IMPORTED' && firstRun.team_created === 1 && firstRun.players_created === 7 && firstRun.memberships_created === 7 && firstRun.staff_created === 1, 'premier import: contrat de retour exact', JSON.stringify(firstRun))
const firstCounts = await scopedCounts()
assert(firstCounts.teams === 1 && firstCounts.players === 7 && firstCounts.memberships === 7 && firstCounts.staff === 1, 'premier import: compteurs 1/7/7/1', JSON.stringify(firstCounts))
const firstMembershipAudit = await must(service.from('team_memberships').select('id,created_by,created_at').eq('team_id', firstRun.team_id).order('id'), 'audit memberships RF3 premier run')

const [lorisPlayers, lorisAssignments] = await Promise.all([
  service.from('players').select('id', { count: 'exact', head: true }).ilike('first_name', 'Loris').ilike('last_name', 'DEPAY'),
  service.from('team_staff_assignments').select('id,profile:profiles!inner(full_name)', { count: 'exact', head: true }).ilike('profile.full_name', 'Loris DEPAY'),
])
if (lorisPlayers.error) throw new Error(`contrôle Loris players: ${lorisPlayers.error.message}`)
if (lorisAssignments.error) throw new Error(`contrôle Loris staff: ${lorisAssignments.error.message}`)
assert(lorisPlayers.count === 0 && lorisAssignments.count === 0, 'Loris: aucun joueur créé et aucune affectation', JSON.stringify({ players: lorisPlayers.count, assignments: lorisAssignments.count }))

const team = await must(service.from('teams').select('id,head_coach_id').eq('name', 'RF3 - SF').eq('season', '2026-2027').single(), 'postcheck équipe RF3')
assert(team.head_coach_id === adminId, 'trigger staff: teams.head_coach_id synchronisé')

const { data: secondRun, error: secondRunError } = await admin.rpc('import_rf3_pilot_2026_2027')
assert(!secondRunError, 'Admin: deuxième invocation réussie', secondRunError?.message)
assert(secondRun?.status === 'ALREADY_IMPORTED' && secondRun.team_created === 0 && secondRun.players_created === 0 && secondRun.memberships_created === 0 && secondRun.staff_created === 0 && secondRun.team_reused === 1 && secondRun.players_reused === 7 && secondRun.memberships_reused === 7 && secondRun.staff_reused === 1, 'deuxième invocation: idempotence exacte', JSON.stringify(secondRun))
const secondCounts = await scopedCounts()
assert(JSON.stringify(secondCounts) === JSON.stringify(firstCounts), 'deuxième invocation: aucune duplication', JSON.stringify(secondCounts))
const secondMembershipAudit = await must(service.from('team_memberships').select('id,created_by,created_at').eq('team_id', firstRun.team_id).order('id'), 'audit memberships RF3 second run')
assert(JSON.stringify(secondMembershipAudit) === JSON.stringify(firstMembershipAudit), 'deuxième invocation: IDs et audit memberships RF3 inchangés')

await Promise.all([admin.auth.signOut(), coach.auth.signOut()])
process.stdout.write('Tous les contrôles transactionnels RF3 sont passés.\n')
