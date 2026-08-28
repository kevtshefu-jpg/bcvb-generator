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

const accountNames = ['admin', 'technicalManager', 'coachA', 'coachB', 'teamStaff', 'parentReferent', 'dirigeant', 'member', 'inactive']
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
  ['teamStaff', 'team_staff'],
  ['parentReferent', 'parent_referent'],
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
  for (const name of ['admin', 'technicalManager', 'dirigeant', 'coachA', 'member', 'inactive']) {
    const { error } = await clients[name].rpc('claim_registration_request_approval', {
      request_id: randomRequestId,
      approved_by_value: fixtureState.accounts.admin.id,
      retry_activation: false,
    })
    check(Boolean(error), `${name}: réservation d’approbation service_role inaccessible`, formatPostgrestError(error))
  }

  for (const name of ['admin', 'technicalManager']) {
    const { data, error } = await clients[name]
      .from('registration_requests')
      .update({ status: 'approved' })
      .eq('id', fixtures.registrationRequest)
      .select('id')
    check(!error && data?.length === 0, `${name}: écriture directe de décision refusée`, error?.message || `lignes=${data?.length}`)
  }

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

const {
  teamA,
  teamB,
  playerA,
  playerA2,
  playerB,
  playerB2,
  contactA,
  contactB,
  sessionA,
  sessionB,
  situationA,
  situationB,
  attendanceSessionA,
  attendanceSessionB,
  attendanceRecordA,
  attendanceRecordB,
} = fixtures

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

await expectVisible(clients.admin, 'attendance_sessions', attendanceSessionA, 'admin: séance Team A visible')
await expectVisible(clients.technicalManager, 'attendance_sessions', attendanceSessionA, 'responsable technique: séance Team A visible')
await expectVisible(clients.dirigeant, 'attendance_sessions', attendanceSessionA, 'dirigeant: séance Team A visible')
await expectVisible(clients.coachA, 'attendance_sessions', attendanceSessionA, 'coach A: séance Team A visible')
await expectHidden(clients.coachA, 'attendance_sessions', attendanceSessionB, 'coach A: séance Team B invisible')
await expectHidden(clients.coachB, 'attendance_sessions', attendanceSessionA, 'coach B: séance Team A invisible')
await expectHidden(clients.member, 'attendance_sessions', attendanceSessionA, 'membre: séance invisible')
await expectHidden(clients.inactive, 'attendance_sessions', attendanceSessionA, 'profil inactif: séance invisible')

await expectVisible(clients.coachA, 'attendance_records', attendanceRecordA, 'coach A: record Team A visible')
await expectHidden(clients.coachA, 'attendance_records', attendanceRecordB, 'coach A: record Team B invisible')
await expectHidden(clients.member, 'attendance_records', attendanceRecordA, 'membre: record invisible')

// GO-02D — écritures officielles et validation serveur des présences.
{
  const coachAId = fixtureState.accounts.coachA.id
  const coachAConcurrent = await authenticatedClient(...accounts.coachA)
  const attendancePayload = (sessionId, playerId, createdBy) => ({
    id: crypto.randomUUID(),
    session_id: sessionId,
    player_id: playerId,
    status: 'present',
    source: 'coach',
    created_by: createdBy,
  })

  const allowedRecord = attendancePayload(attendanceSessionA, playerA2, coachAId)
  const { data: createdRecord, error: createOwnError } = await clients.coachA
    .rpc('save_attendance_record', { record_payload: { ...allowedRecord, id: null }, expected_version: null })
  check(!createOwnError && createdRecord?.ok === true, 'coach A: création présence Team A autorisée', formatPostgrestError(createOwnError))

  const { error: concurrentInsertError } = await clients.coachA.rpc('save_attendance_record', {
    record_payload: { ...allowedRecord, id: null, status: 'absent_excused' }, expected_version: null,
  })
  check(concurrentInsertError?.code === 'PT409', 'création concurrente du même relevé refusée comme conflit', formatPostgrestError(concurrentInsertError))

  const sensitiveSentinel = 'GO-02E.8 note sensible'
  const { data: draftUpdate, error: draftUpdateError } = await clients.coachA
    .rpc('save_attendance_record', { record_payload: {
      id: attendanceRecordA,
      session_id: attendanceSessionA,
      player_id: playerA,
      status: 'absent_excused',
      reason: sensitiveSentinel,
      injury_note: sensitiveSentinel,
      logistic_note: sensitiveSentinel,
      coach_comment: sensitiveSentinel,
      source: 'coach',
    }, expected_version: 1 })
  check(!draftUpdateError && draftUpdate?.version === 2, 'coach A: modification version 1 produit version 2', formatPostgrestError(draftUpdateError))

  const { error: staleUpdateError } = await coachAConcurrent.rpc('save_attendance_record', {
    record_payload: { id: attendanceRecordA, session_id: attendanceSessionA, player_id: playerA, status: 'present', source: 'coach' },
    expected_version: 1,
  })
  check(staleUpdateError?.code === 'PT409', 'version obsolète refusée comme conflit', formatPostgrestError(staleUpdateError))

  const { data: nextUpdate, error: nextUpdateError } = await clients.coachA.rpc('save_attendance_record', {
    record_payload: { id: attendanceRecordA, session_id: attendanceSessionA, player_id: playerA, status: 'absent_excused', reason: sensitiveSentinel, injury_note: sensitiveSentinel, logistic_note: sensitiveSentinel, coach_comment: sensitiveSentinel, source: 'coach' },
    expected_version: 2,
  })
  check(!nextUpdateError && nextUpdate?.version === 3, 'relecture version 2 puis sauvegarde produit version 3', formatPostgrestError(nextUpdateError))

  const idempotentPayload = {
    team_id: teamA,
    training_slot_id: null,
    session_date: '2025-01-15',
    title: 'Test idempotence concurrente',
    session_type: 'entrainement',
    start_time: '06:07',
    end_time: '07:07',
    location_name: 'Terrain test',
  }
  const concurrentSessions = await Promise.all([
    clients.coachA.rpc('create_attendance_session_idempotent', { session_payload: idempotentPayload }),
    coachAConcurrent.rpc('create_attendance_session_idempotent', { session_payload: idempotentPayload }),
  ])
  check(
    concurrentSessions.every(({ error }) => !error)
      && concurrentSessions[0].data?.id === concurrentSessions[1].data?.id,
    'double création concurrente: les deux appels retournent la même séance',
    concurrentSessions.map(({ error }) => formatPostgrestError(error)).join(' | '),
  )
  const { data: idempotentRows, error: idempotentReadError } = await clients.coachA
    .from('attendance_sessions')
    .select('id')
    .eq('team_id', teamA)
    .eq('session_date', idempotentPayload.session_date)
    .eq('session_type', idempotentPayload.session_type)
    .eq('start_time', idempotentPayload.start_time)
  check(
    !idempotentReadError && idempotentRows?.length === 1,
    'double création concurrente: une seule séance persiste',
    idempotentReadError?.message || `lignes=${idempotentRows?.length}`,
  )

  for (const [clientName, sessionId, playerId, label] of [
    ['coachA', attendanceSessionB, playerB2, 'coach A: RPC présence Team B refusée'],
    ['dirigeant', attendanceSessionA, playerA2, 'dirigeant: RPC écriture présence refusée'],
  ]) {
    const { error } = await clients[clientName].rpc('save_attendance_record', {
      record_payload: { ...attendancePayload(sessionId, playerId, fixtureState.accounts[clientName].id), id: null },
      expected_version: null,
    })
    check(error?.code === '42501', label, formatPostgrestError(error))
  }

  for (const [clientName, sessionId, playerId, label] of [
    ['coachA', attendanceSessionB, playerB2, 'coach A: création présence Team B refusée'],
    ['dirigeant', attendanceSessionA, playerA2, 'dirigeant: écriture présence refusée'],
    ['teamStaff', attendanceSessionA, playerA2, 'team_staff: écriture officielle refusée'],
    ['member', attendanceSessionA, playerA2, 'membre: écriture refusée'],
  ]) {
    const actorId = fixtureState.accounts[clientName].id
    const { error } = await clients[clientName]
      .from('attendance_records')
      .insert(attendancePayload(sessionId, playerId, actorId))
    check(error?.code === '42501', label, formatPostgrestError(error))
  }

  const { error: directValidationError } = await clients.coachA
    .from('attendance_records')
    .update({ validated_by_coach: true, updated_by: coachAId })
    .eq('id', attendanceRecordA)
  check(directValidationError?.code === '42501', 'écriture directe validated_by_coach=true refusée', formatPostgrestError(directValidationError))

  const validationCases = [
    ['admin', attendanceSessionA, true, 'admin: validation séance autorisée'],
    ['technicalManager', attendanceSessionA, true, 'responsable technique: validation autorisée'],
    ['coachA', attendanceSessionA, true, 'coach A: validation Team A autorisée'],
    ['coachA', attendanceSessionB, false, 'coach A: validation Team B refusée'],
    ['dirigeant', attendanceSessionA, false, 'dirigeant: validation refusée'],
    ['parentReferent', attendanceSessionA, false, 'parent référent: validation refusée'],
    ['member', attendanceSessionA, false, 'membre: validation refusée'],
    ['inactive', attendanceSessionA, false, 'profil inactif: validation refusée'],
  ]

  for (const [clientName, sessionId, allowed, label] of validationCases) {
    const { data, error } = await clients[clientName].rpc('validate_attendance_session', {
      target_session_id: sessionId,
    })
    check(
      allowed ? !error && data?.ok === true && data?.session_id === sessionId : error?.code === '42501',
      label,
      error ? formatPostgrestError(error) : `session_id=${data?.session_id || 'absent'}`,
    )
  }

  const { data: validatedRecord, error: validatedRecordError } = await clients.admin
    .from('attendance_records')
    .select('validated_by_coach')
    .eq('id', attendanceRecordA)
    .single()
  check(!validatedRecordError && validatedRecord?.validated_by_coach === true, 'RPC: validated_by_coach=true confirmé après validation', formatPostgrestError(validatedRecordError))

  const { error: lockedUpdateError } = await clients.coachA
    .from('attendance_records')
    .update({ status: 'present', updated_by: coachAId })
    .eq('id', attendanceRecordA)
  check(lockedUpdateError?.code === '42501', 'séance validée: UPDATE direct refusé', formatPostgrestError(lockedUpdateError))

  const { error: lockedInsertError } = await clients.coachA
    .from('attendance_records')
    .insert(attendancePayload(attendanceSessionA, playerA2, coachAId))
  check(lockedInsertError?.code === '42501', 'séance validée: INSERT direct refusé', formatPostgrestError(lockedInsertError))

  const { error: lockedDeleteError } = await clients.admin
    .from('attendance_records')
    .delete()
    .eq('id', attendanceRecordA)
  check(lockedDeleteError?.code === '42501', 'séance validée: DELETE direct refusé', formatPostgrestError(lockedDeleteError))

  const { error: lockedRpcUpdateError } = await clients.coachA.rpc('save_attendance_record', {
    record_payload: { id: attendanceRecordA, session_id: attendanceSessionA, player_id: playerA, status: 'present', source: 'coach' },
    expected_version: 3,
  })
  check(lockedRpcUpdateError?.code === '42501', 'séance validée: mutation RPC refusée', formatPostgrestError(lockedRpcUpdateError))

  const { error: unlockSessionError } = await clients.coachA
    .from('attendance_sessions')
    .update({ status: 'draft' })
    .eq('id', attendanceSessionA)
  check(unlockSessionError?.code === '42501', 'séance validée: retour direct à draft refusé', formatPostgrestError(unlockSessionError))

  const { error: deleteSessionError } = await clients.admin
    .from('attendance_sessions')
    .delete()
    .eq('id', attendanceSessionA)
  check(deleteSessionError?.code === '42501', 'séance validée: suppression directe refusée', formatPostgrestError(deleteSessionError))

  for (const [clientName, label] of [
    ['admin', 'admin'],
    ['technicalManager', 'responsable technique'],
    ['coachA', 'coach A'],
  ]) {
    const { data, error } = await clients[clientName].rpc('read_attendance_records', {
      target_session_id: attendanceSessionA,
      target_player_id: null,
    })
    const record = data?.find((item) => item.id === attendanceRecordA)
    check(!error && record?.coach_comment === sensitiveSentinel, `${label}: commentaire coach sensible accessible`, formatPostgrestError(error))
    check(
      record?.reason === sensitiveSentinel
        && record?.injury_note === sensitiveSentinel
        && record?.logistic_note === sensitiveSentinel,
      `${label}: autres notes attendance sensibles accessibles`,
    )
  }

  const { data: leaderRecords, error: leaderReadError } = await clients.dirigeant.rpc('read_attendance_records', {
    target_session_id: attendanceSessionA,
    target_player_id: null,
  })
  const leaderRecord = leaderRecords?.find((item) => item.id === attendanceRecordA)
  check(!leaderReadError && leaderRecord?.coach_comment === null, 'dirigeant: commentaire coach non transmis par le serveur', formatPostgrestError(leaderReadError))
  check(
    leaderRecord?.reason === null
      && leaderRecord?.injury_note === null
      && leaderRecord?.logistic_note === null,
    'dirigeant: autres notes attendance sensibles non transmises',
  )

  const { error: directSensitiveReadError } = await clients.dirigeant
    .from('attendance_records')
    .select('coach_comment')
    .eq('id', attendanceRecordA)
  check(directSensitiveReadError?.code === '42501', 'dirigeant: SELECT direct coach_comment refusé', formatPostgrestError(directSensitiveReadError))

  const { data: otherTeamRecords, error: otherTeamReadError } = await clients.coachA.rpc('read_attendance_records', {
    target_session_id: attendanceSessionB,
    target_player_id: null,
  })
  check(!otherTeamReadError && otherTeamRecords?.length === 0, 'coach A: read model Team B vide', formatPostgrestError(otherTeamReadError))

  for (const clientName of ['member', 'inactive']) {
    const { data, error } = await clients[clientName].rpc('read_attendance_records', {
      target_session_id: attendanceSessionA,
      target_player_id: null,
    })
    check(!error && data?.length === 0, `${clientName}: read model attendance vide`, formatPostgrestError(error))
  }
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

// GO-02B — contrat transactionnel des affectations staff.
{
  const coachAId = fixtureState.accounts.coachA.id
  const coachBId = fixtureState.accounts.coachB.id
  const memberId = fixtureState.accounts.member.id
  const inactiveId = fixtureState.accounts.inactive.id
  const absentId = crypto.randomUUID()

  const { error: directWriteError } = await clients.admin.from('team_staff_assignments').insert({
    team_id: teamA,
    profile_id: memberId,
    assignment_role: 'parent_referent',
    is_active: true,
  })
  check(directWriteError?.code === '42501', 'admin: écriture staff directe refusée au profit de la RPC', formatPostgrestError(directWriteError))

  for (const name of ['dirigeant', 'coachA', 'member', 'inactive']) {
    const { error } = await clients[name].rpc('assign_team_staff', {
      target_team_id: teamA,
      target_profile_id: memberId,
      target_assignment_role: 'parent_referent',
    })
    check(error?.code === '42501', `${name}: mutation staff refusée`, formatPostgrestError(error))
  }

  for (const [profileId, label] of [[inactiveId, 'inactif'], [absentId, 'absent']]) {
    const { error } = await clients.admin.rpc('assign_team_staff', {
      target_team_id: teamA,
      target_profile_id: profileId,
      target_assignment_role: 'assistant_coach',
    })
    check(error?.code === 'P0002', `profil ${label}: affectation refusée`, formatPostgrestError(error))
  }

  const { data: assistant, error: assistantError } = await clients.admin.rpc('assign_team_staff', {
    target_team_id: teamA,
    target_profile_id: coachBId,
    target_assignment_role: 'assistant_coach',
  })
  check(!assistantError && assistant?.ok === true, 'admin: assistant ajouté par RPC', assistantError?.message)
  const { data: assistantTeam } = await clients.admin.from('teams').select('assistant_coach_ids').eq('id', teamA).single()
  check(assistantTeam?.assistant_coach_ids?.includes(coachBId), 'assistant_coach_ids synchronisé après ajout')

  const { error: duplicateError } = await clients.admin.rpc('assign_team_staff', {
    target_team_id: teamA,
    target_profile_id: coachBId,
    target_assignment_role: 'assistant_coach',
  })
  check(duplicateError?.code === '23505', 'doublon actif refusé', formatPostgrestError(duplicateError))
  const { data: assistantRowsAfterFailure } = await clients.admin.from('team_staff_assignments').select('id').eq('team_id', teamA).eq('assignment_role', 'assistant_coach').eq('is_active', true)
  check(assistantRowsAfterFailure?.length === 1, 'échec transactionnel sans moitié de mutation assistant')

  const { error: removeAssistantError } = await clients.admin.rpc('remove_team_staff', { target_assignment_id: assistant.assignment_id })
  check(!removeAssistantError, 'admin: assistant retiré', removeAssistantError?.message)
  const { data: assistantHistory } = await clients.admin.from('team_staff_assignments').select('is_active').eq('id', assistant.assignment_id).single()
  const { data: teamWithoutAssistant } = await clients.admin.from('teams').select('assistant_coach_ids').eq('id', teamA).single()
  check(assistantHistory?.is_active === false, 'historique assistant conservé comme inactif')
  check(teamWithoutAssistant?.assistant_coach_ids?.length === 0, 'assistant_coach_ids synchronisé après retrait')

  const { data: parentAssignment, error: parentError } = await clients.technicalManager.rpc('assign_team_staff', {
    target_team_id: teamA,
    target_profile_id: memberId,
    target_assignment_role: 'parent_referent',
  })
  check(!parentError && parentAssignment?.ok === true, 'responsable technique: parent référent ajouté', parentError?.message)
  const { error: removeParentError } = await clients.technicalManager.rpc('remove_team_staff', { target_assignment_id: parentAssignment?.assignment_id })
  check(!removeParentError, 'responsable technique: parent référent retiré', removeParentError?.message)
  const { data: optionalRows } = await clients.admin.from('team_staff_assignments').select('assignment_role').eq('team_id', teamA).in('assignment_role', ['assistant_coach', 'parent_referent']).eq('is_active', true)
  check(optionalRows?.length === 0, 'assistant et parent référent restent optionnels')

  const { data: replacement, error: replacementError } = await clients.admin.rpc('assign_team_staff', {
    target_team_id: teamA,
    target_profile_id: coachBId,
    target_assignment_role: 'head_coach',
  })
  check(!replacementError && replacement?.ok === true, 'coach principal remplacé atomiquement', replacementError?.message)
  const { data: headRows } = await clients.admin.from('team_staff_assignments').select('profile_id,is_active').eq('team_id', teamA).eq('assignment_role', 'head_coach')
  const { data: replacedTeam } = await clients.admin.from('teams').select('head_coach_id').eq('id', teamA).single()
  check(headRows?.filter((row) => row.is_active).length === 1 && headRows.find((row) => row.profile_id === coachAId)?.is_active === false, 'ancien coach désactivé et un seul coach actif')
  check(replacedTeam?.head_coach_id === coachBId, 'teams.head_coach_id synchronisé')

  const concurrentResults = await Promise.all([
    clients.admin.rpc('assign_team_staff', { target_team_id: teamB, target_profile_id: coachAId, target_assignment_role: 'head_coach' }),
    clients.technicalManager.rpc('assign_team_staff', { target_team_id: teamB, target_profile_id: memberId, target_assignment_role: 'head_coach' }),
  ])
  check(concurrentResults.every((result) => !result.error && result.data?.ok === true), 'deux remplacements concurrents sérialisés')
  const { data: concurrentHeads } = await clients.admin.from('team_staff_assignments').select('profile_id,is_active').eq('team_id', teamB).eq('assignment_role', 'head_coach')
  check(concurrentHeads?.filter((row) => row.is_active).length === 1, 'concurrence: jamais plus d’un coach principal actif')
  check((concurrentHeads || []).length >= 3, 'historique des remplacements concurrents conservé')
  // Restaure l'isolation initiale des fixtures pour les contrats suivants.
  for (const targetTeam of [teamA, teamB]) {
    const { data: activeHeads } = await clients.admin.from('team_staff_assignments').select('id').eq('team_id', targetTeam).eq('assignment_role', 'head_coach').eq('is_active', true)
    for (const head of activeHeads || []) await clients.admin.rpc('remove_team_staff', { target_assignment_id: head.id })
  }
  await clients.admin.rpc('assign_team_staff', { target_team_id: teamA, target_profile_id: coachAId, target_assignment_role: 'head_coach' })
  await clients.admin.rpc('assign_team_staff', { target_team_id: teamB, target_profile_id: coachBId, target_assignment_role: 'head_coach' })
}

// GO-02C — planning opérationnel partagé.
{
  const locationA = `Salle RLS ${crypto.randomUUID()}`
  const save = (client, overrides = {}) => client.rpc('save_training_slot', {
    target_slot_id: null, target_team_id: teamA, target_season: 'RLS-TEST', target_weekday: 2,
    target_start_time: '18:00', target_end_time: '19:30', target_location_name: locationA,
    target_valid_from: '2026-09-01', target_valid_until: '2027-06-30', allow_conflict: false, ...overrides,
  })
  for (const name of ['dirigeant','coachA','member','inactive']) {
    const { error } = await save(clients[name])
    check(error?.code === '42501', `${name}: écriture planning opérationnel refusée`, formatPostgrestError(error))
  }
  const { error: conflictReadDenied } = await clients.member.rpc('find_training_slot_conflicts',{target_team_id:teamA,target_weekday:2,target_start_time:'18:00',target_end_time:'19:00',target_location_name:locationA,target_valid_from:'2026-09-01',target_valid_until:null,excluded_slot_id:null})
  check(conflictReadDenied?.code==='42501','membre: diagnostic global des conflits inaccessible',formatPostgrestError(conflictReadDenied))
  const { error: missingTeam } = await save(clients.admin,{target_team_id:crypto.randomUUID()})
  check(Boolean(missingTeam),'équipe inexistante refusée',formatPostgrestError(missingTeam))
  const { error: invalidDay } = await save(clients.admin,{target_weekday:8})
  check(invalidDay?.code==='22023','jour invalide refusé',formatPostgrestError(invalidDay))
  const { error: invalidTime } = await save(clients.admin,{target_start_time:'20:00',target_end_time:'19:00'})
  check(invalidTime?.code==='22023','horaire invalide refusé',formatPostgrestError(invalidTime))

  const { data: adminSlot,error:adminSlotError }=await save(clients.admin)
  check(!adminSlotError&&adminSlot?.ok===true,'admin: création créneau confirmée',adminSlotError?.message)
  const { data: rtSlot,error:rtSlotError }=await save(clients.technicalManager,{target_team_id:teamB,target_location_name:`${locationA} annexe`})
  check(!rtSlotError&&rtSlot?.ok===true,'responsable technique: création créneau confirmée',rtSlotError?.message)
  const { data: conflict,error:conflictError }=await save(clients.admin,{target_team_id:teamB,target_start_time:'19:00',target_end_time:'20:00'})
  check(!conflictError&&conflict?.ok===false&&conflict?.code==='SLOT_CONFLICT','conflit même salle détecté')
  const { data: successive,error:successiveError }=await save(clients.admin,{target_team_id:teamB,target_start_time:'19:30',target_end_time:'20:30'})
  check(!successiveError&&successive?.ok===true,'créneaux successifs autorisés',successiveError?.message)
  const { data: coachAVisible }=await clients.coachA.from('training_slots').select('id').eq('id',adminSlot.slot_id)
  const { data: coachBHidden }=await clients.coachA.from('training_slots').select('id').eq('id',rtSlot.slot_id)
  check(coachAVisible?.length===1&&coachBHidden?.length===0,'coach: lecture limitée à ses équipes')

  const { data: modified,error:modifyError }=await save(clients.admin,{target_slot_id:adminSlot.slot_id,target_start_time:'17:45'})
  check(!modifyError&&modified?.ok===true,'modification créneau confirmée serveur',modifyError?.message)
  const { data: modifiedRow }=await clients.admin.from('training_slots').select('start_time').eq('id',adminSlot.slot_id).single()
  check(modifiedRow?.start_time?.startsWith('17:45'),'modification réellement persistée')
  const { data: disabled,error:disableError }=await clients.admin.rpc('deactivate_training_slot',{target_slot_id:adminSlot.slot_id})
  check(!disableError&&disabled?.ok===true,'désactivation confirmée serveur',disableError?.message)
  const { data: disabledRow }=await clients.admin.from('training_slots').select('is_active').eq('id',adminSlot.slot_id).single()
  check(disabledRow?.is_active===false,'créneau désactivé sans suppression physique')
  for(const id of [rtSlot.slot_id,successive.slot_id]) await clients.admin.rpc('deactivate_training_slot',{target_slot_id:id})
}

await Promise.all(Object.values(clients).map((client) => client.auth.signOut()))

if (failures) {
  throw new Error(`${failures} contrôle(s) RLS en échec.`)
}

process.stdout.write('Tous les contrôles RLS configurés sont passés.\n')
