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

const accountNames = ['admin', 'technicalManager', 'coachA', 'coachSameTeam', 'coachB', 'teamStaff', 'parentReferent', 'dirigeant', 'member', 'inactive']
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
const anonClient = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

for (const [name, expectedRole] of [
  ['admin', 'admin'],
  ['technicalManager', 'responsable_technique'],
  ['coachA', 'coach'],
  ['coachSameTeam', 'coach'],
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
  sessionPublishedA,
  sessionArchivedA,
  sessionRichA,
  sessionDeletedA,
  situationA,
  situationB,
  situationPublishedA,
  situationArchivedA,
  sessionSituationA,
  sessionTagA,
  situationTagA,
  richBlockFirst,
  richBlockSecond,
  attendanceSessionA,
  attendanceSessionB,
  attendanceRecordA,
  attendanceRecordB,
  attendanceSlotSeasonMismatch,
  attendanceSlotCancelled,
  attendanceSlotStart,
  attendanceSlotEnd,
  attendanceSlotLocation,
  attendanceSlotCombined,
  attendanceSlotMoved,
} = fixtures

for (const [name, expectedA, expectedB] of [
  ['admin', true, true],
  ['technicalManager', true, true],
  ['dirigeant', true, true],
  ['coachA', true, false],
  ['coachSameTeam', true, false],
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

for (const [table, ownId, otherId] of [
  ['sessions', sessionA, sessionB],
  ['situations', situationA, situationB],
]) {
  await expectVisible(clients.admin, table, ownId, `admin: ${table} private visible`)
  await expectVisible(clients.technicalManager, table, ownId, `responsable technique: ${table} private visible`)
  await expectVisible(clients.coachA, table, ownId, `coach propriétaire: ${table} private visible`)
  await expectHidden(clients.coachSameTeam, table, ownId, `coach même équipe non propriétaire: ${table} private invisible`)
  await expectHidden(clients.coachB, table, ownId, `coach hors équipe: ${table} private invisible`)
  await expectHidden(clients.dirigeant, table, ownId, `dirigeant: ${table} private invisible`)
  await expectHidden(clients.teamStaff, table, ownId, `staff équipe: ${table} private invisible`)
  await expectHidden(clients.parentReferent, table, ownId, `parent référent: ${table} private invisible`)
  await expectHidden(clients.member, table, ownId, `membre: ${table} private invisible`)
  await expectHidden(clients.inactive, table, ownId, `profil inactif: ${table} private invisible`)
  await expectHidden(clients.coachA, table, otherId, `coach propriétaire: ${table} autre équipe invisible`)
}

{
  const sessionIds = {
    clubDraft: crypto.randomUUID(), publicDraft: crypto.randomUUID(), downgradedOwner: crypto.randomUUID(), inactiveOwner: crypto.randomUUID(),
  }
  const situationIds = {
    clubDraft: crypto.randomUUID(), publicDraft: crypto.randomUUID(), downgradedOwner: crypto.randomUUID(), inactiveOwner: crypto.randomUUID(),
  }
  const { error: matrixSessionsError } = await clients.admin.from('sessions').insert([
    { id: sessionIds.clubDraft, title: 'Draft club non diffusé', team_id: teamA, coach_id: fixtureState.accounts.coachA.id, owner_id: fixtureState.accounts.coachA.id, visibility: 'club', status: 'draft' },
    { id: sessionIds.publicDraft, title: 'Draft public non diffusé', team_id: teamA, coach_id: fixtureState.accounts.coachA.id, owner_id: fixtureState.accounts.coachA.id, visibility: 'public', status: 'draft' },
    { id: sessionIds.downgradedOwner, title: 'Private ancien coach member', team_id: teamA, coach_id: fixtureState.accounts.member.id, owner_id: fixtureState.accounts.member.id, visibility: 'private', status: 'draft' },
    { id: sessionIds.inactiveOwner, title: 'Private ancien coach inactif', team_id: teamA, coach_id: fixtureState.accounts.inactive.id, owner_id: fixtureState.accounts.inactive.id, visibility: 'private', status: 'draft' },
  ])
  const { error: matrixSituationsError } = await clients.admin.from('situations').insert([
    { id: situationIds.clubDraft, title: 'Situation draft club non diffusée', team_id: teamA, owner_id: fixtureState.accounts.coachA.id, created_by: fixtureState.accounts.coachA.id, visibility: 'club', status: 'draft' },
    { id: situationIds.publicDraft, title: 'Situation draft public non diffusée', team_id: teamA, owner_id: fixtureState.accounts.coachA.id, created_by: fixtureState.accounts.coachA.id, visibility: 'public', status: 'draft' },
    { id: situationIds.downgradedOwner, title: 'Situation private ancien coach member', team_id: teamA, owner_id: fixtureState.accounts.member.id, created_by: fixtureState.accounts.member.id, visibility: 'private', status: 'draft' },
    { id: situationIds.inactiveOwner, title: 'Situation private ancien coach inactif', team_id: teamA, owner_id: fixtureState.accounts.inactive.id, created_by: fixtureState.accounts.inactive.id, visibility: 'private', status: 'draft' },
  ])
  check(!matrixSessionsError && !matrixSituationsError, 'workflow lecture: fixtures status/visibility créées', formatPostgrestError(matrixSessionsError || matrixSituationsError))
  for (const [table, ids] of [['sessions', sessionIds], ['situations', situationIds]]) {
    await expectVisible(clients.coachA, table, ids.clubDraft, `workflow lecture: coach owner lit ${table} draft club`)
    await expectVisible(clients.coachA, table, ids.publicDraft, `workflow lecture: coach owner lit ${table} draft public`)
    await expectHidden(clients.member, table, ids.clubDraft, `workflow lecture: membre ne lit pas ${table} draft club`)
    await expectHidden(clients.member, table, ids.publicDraft, `workflow lecture: membre ne lit pas ${table} draft public`)
    await expectHidden(clients.teamStaff, table, ids.clubDraft, `workflow lecture: staff ne lit pas ${table} draft club`)
    await expectHidden(clients.member, table, ids.downgradedOwner, `workflow lecture: owner rétrogradé member ne lit pas ${table} private`)
    await expectHidden(clients.inactive, table, ids.inactiveOwner, `workflow lecture: owner inactif ne lit pas ${table} private`)
  }
  await clients.admin.from('sessions').delete().in('id', Object.values(sessionIds))
  await clients.admin.from('situations').delete().in('id', Object.values(situationIds))
}

{
  const projection = 'id,title,category,theme,sub_theme,team_id,coach_id,owner_id,visibility,status,duration_minutes,expected_players,quality_score,version,content_json,session_situations(id,order_index,title,duration_minutes,content_json),session_tags(tag)'
  const { data: richRows, error: richError } = await clients.member.from('sessions').select(projection).eq('id', sessionRichA).is('deleted_at', null).single()
  check(!richError && richRows?.id === sessionRichA && richRows?.version === 7, 'service read: membre actif lit la séance club riche avec sa version', formatPostgrestError(richError))
  const orderedBlocks = [...(richRows?.session_situations || [])].sort((a, b) => a.order_index - b.order_index)
  check(orderedBlocks.map(({ id }) => id).join(',') === [richBlockFirst, richBlockSecond].join(','), 'service read: session_situations restituées dans l’ordre canonique')
  check(orderedBlocks[0]?.content_json?.courtFrames?.[0]?.id === 'court-server-1' && orderedBlocks[0]?.content_json?.courtFrames?.[0]?.objects?.[0]?.id === 'attack-server-1', 'service read: IDs riches du terrain préservés')
  const tags = (richRows?.session_tags || []).map(({ tag }) => tag).sort()
  check(tags.join(',') === ['fixture-read', 'fixture-rich'].join(','), 'service read: tags relationnels restitués sans doublon')
  const { data: inactiveRich } = await clients.inactive.from('sessions').select('id').eq('id', sessionRichA)
  check(inactiveRich?.length === 0, 'service read: profil inactif ne lit pas la séance club')
  const { data: deletedRows, error: deletedError } = await clients.admin.from('sessions').select('id').eq('id', sessionDeletedA).is('deleted_at', null)
  check(!deletedError && deletedRows?.length === 0, 'service read: soft-deleted exclu par défaut', formatPostgrestError(deletedError))
}

{
  const sessionPayload = (title) => ({ title, category: 'U15', level: 'fixture', theme: 'Passe', sub_theme: '', visibility: 'private', duration_minutes: 20, expected_players: 8, source_type: 'manual', source_file_name: '', source_raw_text: '', source_text: '', content_json: { objectives: ['Fixture RPC'] }, quality_score: 60 })
  const createArgs = { target_team_id: teamA, target_coach_id: fixtureState.accounts.coachA.id, session_payload: sessionPayload('Création RPC RLS'), situations_payload: [{ id: crypto.randomUUID(), order_index: 1, title: 'Bloc RPC', duration_minutes: 20, theme: 'Passe', sub_theme: '', pedagogical_phase: 'je-m-exerce', content_json: {} }], tags_payload: [' rpc ', 'rpc'] }
  const { data: createdRpc, error: createdRpcError } = await clients.coachA.rpc('create_session_draft', createArgs)
  check(!createdRpcError && createdRpc?.version === 1, 'RPC session: coach autorisé crée un draft version 1', formatPostgrestError(createdRpcError))
  const { data: createdRow } = await clients.coachA.from('sessions').select('status,owner_id,version,session_situations(id),session_tags(tag)').eq('id', createdRpc?.id).single()
  check(createdRow?.status === 'draft' && createdRow?.owner_id === fixtureState.accounts.coachA.id && createdRow?.session_situations?.length === 1 && createdRow?.session_tags?.length === 1, 'RPC session: owner, blocs et tags imposés atomiquement')

  for (const [name, args] of [
    ['coachB', createArgs], ['member', createArgs], ['inactive', createArgs],
  ]) {
    const { error } = await clients[name].rpc('create_session_draft', args)
    check(error?.code === '42501', `RPC session: création refusée pour ${name}`, formatPostgrestError(error))
  }
  const beforeInvalidCreate = await clients.admin.from('sessions').select('id').eq('title', 'Création enfant invalide')
  const { error: invalidChildCreate } = await clients.coachA.rpc('create_session_draft', { ...createArgs, session_payload: sessionPayload('Création enfant invalide'), situations_payload: [{ order_index: 1, title: 'A', duration_minutes: 10 }, { order_index: 1, title: 'B', duration_minutes: 10 }] })
  const afterInvalidCreate = await clients.admin.from('sessions').select('id').eq('title', 'Création enfant invalide')
  check(Boolean(invalidChildCreate) && beforeInvalidCreate.data?.length === afterInvalidCreate.data?.length, 'RPC session: enfant invalide rollback la création')

  const { error: nonOwnerSave } = await clients.coachSameTeam.rpc('save_session_draft', { target_session_id: createdRpc?.id, expected_version: 1, session_payload: sessionPayload('Interdit'), situations_payload: [], tags_payload: [] })
  check(nonOwnerSave?.code === '42501', 'RPC session: coach même équipe non-owner refusé', formatPostgrestError(nonOwnerSave))
  for (const name of ['coachB', 'member', 'inactive']) {
    const { error } = await clients[name].rpc('save_session_draft', { target_session_id: createdRpc?.id, expected_version: 1, session_payload: sessionPayload('Interdit'), situations_payload: [], tags_payload: [] })
    check(error?.code === '42501', `RPC session: sauvegarde refusée pour ${name}`, formatPostgrestError(error))
  }
  const { error: coachPublicSave } = await clients.coachA.rpc('save_session_draft', { target_session_id: createdRpc?.id, expected_version: 1, session_payload: { ...sessionPayload('Visibilité interdite'), visibility: 'public' }, situations_payload: [], tags_payload: [] })
  check(coachPublicSave?.code === '42501', 'RPC session: coach ne peut pas élargir la visibilité du draft', formatPostgrestError(coachPublicSave))
  for (const [label, id, version] of [['published', sessionPublishedA, 1], ['archived', sessionArchivedA, 1], ['soft-deleted', sessionDeletedA, 1]]) {
    const { error } = await clients.admin.rpc('save_session_draft', { target_session_id: id, expected_version: version, session_payload: sessionPayload('Transition interdite'), situations_payload: [], tags_payload: [] })
    check(error?.code === '42501', `RPC session: save ${label} refusé`, formatPostgrestError(error))
  }
  const { error: takeoverPayload } = await clients.coachA.rpc('save_session_draft', { target_session_id: createdRpc?.id, expected_version: 1, session_payload: { ...sessionPayload('Takeover'), owner_id: fixtureState.accounts.coachSameTeam.id }, situations_payload: [], tags_payload: [] })
  check(takeoverPayload?.code === '22023', 'RPC session: owner/team takeover absent du contrat', formatPostgrestError(takeoverPayload))
  const { error: directVersionSession } = await clients.coachA.from('sessions').update({ version: 999 }).eq('id', createdRpc?.id)
  const { error: directVersionSituation } = await clients.coachA.from('situations').update({ version: 999 }).eq('id', situationA)
  check(directVersionSession?.code === '42501' && directVersionSituation?.code === '42501', 'version=999 directe refusée sur sessions et situations')
  for (const [label, mutation] of [
    ['status=published', { status: 'published' }],
    ['visibility=club', { visibility: 'club' }],
    ['published_at', { published_at: new Date().toISOString() }],
    ['archived_at', { archived_at: new Date().toISOString() }],
  ]) {
    const { error } = await clients.coachA.from('sessions').update(mutation).eq('id', createdRpc?.id)
    check(error?.code === '42501', `workflow session: UPDATE direct ${label} refusé`, formatPostgrestError(error))
  }

  const transitionArgs = (id, version) => ({ target_session_id: id, expected_version: version })
  const publishArgs = (id, version, visibility) => ({ ...transitionArgs(id, version), target_visibility: visibility })
  const { data: submittedPrivate, error: submitPrivateError } = await clients.coachA.rpc('submit_session_for_review', transitionArgs(createdRpc?.id, 1))
  check(!submitPrivateError && submittedPrivate?.status === 'to_review' && submittedPrivate?.version === 2, 'workflow session: coach owner soumet draft → to_review', formatPostgrestError(submitPrivateError))
  await expectHidden(clients.member, 'sessions', createdRpc?.id, 'workflow session: to_review private non diffusée au membre')
  const { error: legacyPublishError } = await clients.admin.rpc('publish_session', transitionArgs(createdRpc?.id, 2))
  check(Boolean(legacyPublishError), 'workflow session: ancienne signature publish_session inexécutable', formatPostgrestError(legacyPublishError))
  const { error: coachPublishError } = await clients.coachA.rpc('publish_session', publishArgs(createdRpc?.id, 2, 'team'))
  check(coachPublishError?.code === '42501', 'workflow session: coach ne publie pas', formatPostgrestError(coachPublishError))
  for (const name of ['member', 'dirigeant', 'inactive']) {
    const { error } = await clients[name].rpc('publish_session', publishArgs(createdRpc?.id, 2, 'team'))
    check(error?.code === '42501', `workflow session: publication refusée pour ${name}`, formatPostgrestError(error))
  }
  for (const [label, visibility] of [['private', 'private'], ['public', 'public'], ['vide', ''], ['null', null], ['legacy', 'club_reference']]) {
    const { error } = await clients.admin.rpc('publish_session', publishArgs(createdRpc?.id, 2, visibility))
    check(error?.code === '22023', `workflow session: visibilité ${label} refusée`, formatPostgrestError(error))
  }
  const { data: failedPublishState } = await clients.admin.from('sessions').select('status,visibility,version,published_at').eq('id', createdRpc?.id).single()
  const { data: failedPublishLogs } = await clients.admin.from('session_visibility_logs').select('action').eq('session_id', createdRpc?.id)
  check(failedPublishState?.status === 'to_review' && failedPublishState?.visibility === 'private' && failedPublishState?.version === 2 && !failedPublishState?.published_at && failedPublishLogs?.every(({ action }) => action !== 'published'), 'workflow session: échecs publication sans mutation ni log')
  const { data: returnedPrivate, error: returnPrivateError } = await clients.admin.rpc('return_session_to_draft', transitionArgs(createdRpc?.id, 2))
  check(!returnPrivateError && returnedPrivate?.status === 'draft' && returnedPrivate?.version === 3, 'workflow session: admin retourne to_review → draft', formatPostgrestError(returnPrivateError))

  const teamArgs = { ...createArgs, session_payload: { ...sessionPayload('Workflow team'), visibility: 'team' }, situations_payload: [{ id: crypto.randomUUID(), order_index: 1, title: 'Bloc immuable', duration_minutes: 20, theme: 'Passe', sub_theme: '', pedagogical_phase: 'je-m-exerce', content_json: { objective: 'Immuable' } }], tags_payload: ['workflow-team'] }
  const { data: teamDraft, error: teamDraftError } = await clients.coachA.rpc('create_session_draft', teamArgs)
  const immutableProjection = 'title,category,level,theme,sub_theme,duration_minutes,expected_players,quality_score,content_json,team_id,coach_id,owner_id,source_type,source_file_name,source_raw_text,source_text,session_situations(id,order_index,title,duration_minutes,theme,sub_theme,pedagogical_phase,content_json),session_tags(tag)'
  const beforeTeam = await clients.coachA.from('sessions').select(immutableProjection).eq('id', teamDraft?.id).single()
  const beforeTeamTransition = await clients.coachA.from('sessions').select('updated_at').eq('id', teamDraft?.id).single()
  const { data: teamReview, error: teamReviewError } = await clients.coachA.rpc('submit_session_for_review', transitionArgs(teamDraft?.id, 1))
  const { error: coachArchiveError } = await clients.coachA.rpc('archive_session', transitionArgs(teamDraft?.id, 2))
  const { data: teamPublished, error: teamPublishError } = await clients.admin.rpc('publish_session', publishArgs(teamDraft?.id, 2, 'team'))
  check(!teamDraftError && !teamReviewError && teamReview?.version === 2 && !teamPublishError && teamPublished?.status === 'published' && teamPublished?.visibility === 'team' && teamPublished?.version === 3 && Boolean(teamPublished?.published_at), 'workflow session: admin publie private/team vers team', formatPostgrestError(teamDraftError || teamReviewError || teamPublishError))
  await expectVisible(clients.coachSameTeam, 'sessions', teamDraft?.id, 'workflow diffusion team: coach autorisé équipe lit')
  await expectHidden(clients.coachB, 'sessions', teamDraft?.id, 'workflow diffusion team: coach hors équipe ne lit pas')
  check(coachArchiveError?.code === '42501', 'workflow session: coach ne peut pas archiver', formatPostgrestError(coachArchiveError))
  const afterTeam = await clients.admin.from('sessions').select(immutableProjection).eq('id', teamDraft?.id).single()
  check(JSON.stringify(beforeTeam.data) === JSON.stringify(afterTeam.data), 'workflow session: contenu parent/blocs/tags immuable pendant publication')
  const { data: teamTransitionState } = await clients.admin.from('sessions').select('status,visibility,version,published_at,archived_at,updated_at').eq('id', teamDraft?.id).single()
  check(teamTransitionState?.status === 'published' && teamTransitionState?.visibility === 'team' && teamTransitionState?.version === 3 && Boolean(teamTransitionState?.published_at) && !teamTransitionState?.archived_at && teamTransitionState?.updated_at !== beforeTeamTransition.data?.updated_at, 'workflow session: publication atomique met à jour statut, visibilité, version et timestamps serveur')
  const { error: stalePublishedError } = await clients.technicalManager.rpc('publish_session', publishArgs(teamDraft?.id, 2, 'club'))
  check(stalePublishedError?.code === 'PT409', 'workflow session: publication stale refusée PT409', formatPostgrestError(stalePublishedError))
  const { error: republishError } = await clients.admin.rpc('publish_session', publishArgs(teamDraft?.id, 3, 'club'))
  check(republishError?.code === '22023', 'workflow session: published → published refusé', formatPostgrestError(republishError))
  const { error: publishedReturnError } = await clients.admin.rpc('return_session_to_draft', transitionArgs(teamDraft?.id, 3))
  check(publishedReturnError?.code === '22023', 'workflow session: published → draft refusé', formatPostgrestError(publishedReturnError))
  const { data: teamArchived, error: teamArchiveError } = await clients.technicalManager.rpc('archive_session', transitionArgs(teamDraft?.id, 3))
  check(!teamArchiveError && teamArchived?.status === 'archived' && teamArchived?.version === 4 && Boolean(teamArchived?.archived_at), 'workflow session: RT archive published → archived', formatPostgrestError(teamArchiveError))
  const { error: archivedPublishError } = await clients.admin.rpc('publish_session', publishArgs(teamDraft?.id, 4, 'team'))
  check(archivedPublishError?.code === '22023', 'workflow session: archived → published refusé', formatPostgrestError(archivedPublishError))
  const { error: deletedPublishError } = await clients.admin.rpc('publish_session', publishArgs(sessionDeletedA, 1, 'team'))
  check(deletedPublishError?.code === '42501', 'workflow session: soft-deleted → published refusé', formatPostgrestError(deletedPublishError))
  const { data: teamLogs } = await clients.admin.from('session_visibility_logs').select('id,action').eq('session_id', teamDraft?.id).order('created_at')
  check(teamLogs?.map(({ action }) => action).join(',') === 'submitted_for_review,published,archived', 'workflow session: exactement un log par transition réussie')
  const { error: directLogUpdate } = await clients.coachA.from('session_visibility_logs').update({ action: 'forged' }).eq('id', teamLogs?.[0]?.id)
  const { error: directLogDelete } = await clients.coachA.from('session_visibility_logs').delete().eq('id', teamLogs?.[0]?.id)
  check(directLogUpdate?.code === '42501' && directLogDelete?.code === '42501', 'workflow session: audit UPDATE/DELETE directs refusés')

  const { data: clubDraft, error: clubDraftError } = await clients.coachA.rpc('create_session_draft', { ...createArgs, session_payload: { ...sessionPayload('Workflow club concurrent'), visibility: 'private' }, situations_payload: [] })
  const { error: clubReviewError } = await clients.coachA.rpc('submit_session_for_review', transitionArgs(clubDraft?.id, 1))
  const { data: clubPublished, error: clubPublishError } = await clients.technicalManager.rpc('publish_session', publishArgs(clubDraft?.id, 2, 'club'))
  check(!clubDraftError && !clubReviewError && !clubPublishError && clubPublished?.status === 'published' && clubPublished?.visibility === 'club' && clubPublished?.version === 3, 'workflow session: RT publie to_review private vers club', formatPostgrestError(clubDraftError || clubReviewError || clubPublishError))
  await expectVisible(clients.member, 'sessions', clubDraft?.id, 'workflow diffusion club: membre actif lit')
  const { error: anonClubError } = await anonClient.from('sessions').select('id').eq('id', clubDraft?.id)
  check(anonClubError?.code === '42501', 'workflow diffusion club: anon reste refusé', formatPostgrestError(anonClubError))

  const createSubmittedPrivate = async (title) => {
    const { data: draft, error: draftError } = await clients.coachA.rpc('create_session_draft', { ...createArgs, session_payload: sessionPayload(title), situations_payload: [] })
    const { error: reviewError } = await clients.coachA.rpc('submit_session_for_review', transitionArgs(draft?.id, 1))
    return { draft, error: draftError || reviewError }
  }
  const rtTeam = await createSubmittedPrivate('Workflow RT vers team')
  const { data: rtTeamPublished, error: rtTeamPublishError } = await clients.technicalManager.rpc('publish_session', publishArgs(rtTeam.draft?.id, 2, 'team'))
  check(!rtTeam.error && !rtTeamPublishError && rtTeamPublished?.visibility === 'team', 'workflow session: RT publie vers team', formatPostgrestError(rtTeam.error || rtTeamPublishError))
  const adminClub = await createSubmittedPrivate('Workflow admin vers club')
  const { data: adminClubPublished, error: adminClubPublishError } = await clients.admin.rpc('publish_session', publishArgs(adminClub.draft?.id, 2, 'club'))
  check(!adminClub.error && !adminClubPublishError && adminClubPublished?.visibility === 'club', 'workflow session: admin publie vers club', formatPostgrestError(adminClub.error || adminClubPublishError))

  const { data: concurrentDraft } = await clients.coachA.rpc('create_session_draft', { ...createArgs, session_payload: { ...sessionPayload('Workflow concurrence'), visibility: 'team' }, situations_payload: [] })
  await clients.coachA.rpc('submit_session_for_review', transitionArgs(concurrentDraft?.id, 1))
  const [clubA, clubB] = await Promise.all([
    clients.admin.rpc('publish_session', publishArgs(concurrentDraft?.id, 2, 'team')),
    clients.technicalManager.rpc('publish_session', publishArgs(concurrentDraft?.id, 2, 'club')),
  ])
  const clubResults = [clubA, clubB]
  check(clubResults.filter(({ error }) => !error).length === 1 && clubResults.filter(({ error }) => error?.code === 'PT409').length === 1, 'workflow session: publication concurrente, un succès et un PT409', formatPostgrestError(clubA.error || clubB.error))
  const { data: clubState } = await clients.admin.from('sessions').select('status,version,published_at').eq('id', concurrentDraft?.id).single()
  const { data: clubLogs } = await clients.admin.from('session_visibility_logs').select('action').eq('session_id', concurrentDraft?.id)
  check(clubState?.status === 'published' && clubState?.version === 3 && Boolean(clubState?.published_at) && clubLogs?.filter(({ action }) => action === 'published').length === 1, 'workflow session: concurrence sans timestamp ni log fantôme')

  const { data: publicDraft } = await clients.admin.rpc('create_session_draft', { ...createArgs, session_payload: { ...sessionPayload('Workflow public refusé'), visibility: 'public' }, situations_payload: [] })
  await clients.coachA.rpc('submit_session_for_review', transitionArgs(publicDraft?.id, 1))
  const { error: publicPublishError } = await clients.admin.rpc('publish_session', publishArgs(publicDraft?.id, 2, 'public'))
  const { data: publicLogs } = await clients.admin.from('session_visibility_logs').select('action').eq('session_id', publicDraft?.id)
  check(publicPublishError?.code === '22023' && publicLogs?.every(({ action }) => action !== 'published'), 'workflow session: publication public refusée sans log publié', formatPostgrestError(publicPublishError))
  const { data: directDraft } = await clients.coachA.rpc('create_session_draft', { ...createArgs, session_payload: { ...sessionPayload('Workflow saut refusé'), visibility: 'team' }, situations_payload: [] })
  const { error: directPublishError } = await clients.admin.rpc('publish_session', publishArgs(directDraft?.id, 1, 'team'))
  check(directPublishError?.code === '22023', 'workflow session: draft → published direct refusé', formatPostgrestError(directPublishError))
}

{
  const publicSessionId = crypto.randomUUID()
  const publicSituationId = crypto.randomUUID()
  const { error: publicSessionError } = await clients.admin.from('sessions').insert({
    id: publicSessionId,
    title: 'Séance publique canonique RLS',
    visibility: 'public',
    status: 'published',
  })
  const { error: publicSituationError } = await clients.admin.from('situations').insert({
    id: publicSituationId,
    title: 'Situation publique canonique RLS',
    visibility: 'public',
    status: 'published',
  })
  check(!publicSessionError && !publicSituationError, 'fixtures public canoniques créées', formatPostgrestError(publicSessionError || publicSituationError))

  await expectVisible(clients.member, 'sessions', sessionPublishedA, 'membre actif du club: session club visible')
  await expectVisible(clients.member, 'situations', situationPublishedA, 'membre actif du club: situation club visible')
  await expectHidden(clients.inactive, 'sessions', sessionPublishedA, 'profil inactif: session club invisible')
  await expectHidden(clients.inactive, 'situations', situationPublishedA, 'profil inactif: situation club invisible')
  await expectHidden(clients.member, 'sessions', sessionA, 'membre actif du club: session private invisible')
  await expectHidden(clients.member, 'situations', situationA, 'membre actif du club: situation private invisible')
  await expectVisible(clients.member, 'sessions', publicSessionId, 'utilisateur authentifié actif: session public visible')
  await expectVisible(clients.member, 'situations', publicSituationId, 'utilisateur authentifié actif: situation public visible')

  for (const [table, id] of [['sessions', publicSessionId], ['situations', publicSituationId]]) {
    const { data, error } = await anonClient.from(table).select('id').eq('id', id)
    check(Boolean(error) && !data, `anon: ${table} public reste inaccessible en GO-03D.2`, formatPostgrestError(error))
  }

  await clients.admin.from('sessions').delete().eq('id', publicSessionId)
  await clients.admin.from('situations').delete().eq('id', publicSituationId)
}

{
  const ownSessionId = crypto.randomUUID()
  const ownSituationId = crypto.randomUUID()
  const adminDeleteId = crypto.randomUUID()
  const managerDeleteId = crypto.randomUUID()
  const adminSituationDeleteId = crypto.randomUUID()
  const managerSituationDeleteId = crypto.randomUUID()

  const { error: ownSessionError } = await clients.coachA.from('sessions').insert({
    id: ownSessionId,
    title: 'Draft propriétaire autorisé',
    team_id: teamA,
    coach_id: fixtureState.accounts.coachA.id,
    owner_id: fixtureState.accounts.coachA.id,
    visibility: 'private',
    status: 'draft',
  })
  check(!ownSessionError, 'coach propriétaire: création draft session autorisée', formatPostgrestError(ownSessionError))
  const { data: ownSession } = await clients.coachA.from('sessions').select('id, version, updated_at').eq('id', ownSessionId).single()

  const { error: ownSituationError } = await clients.coachA.from('situations').insert({
    id: ownSituationId,
    title: 'Draft situation propriétaire autorisé',
    team_id: teamA,
    owner_id: fixtureState.accounts.coachA.id,
    created_by: fixtureState.accounts.coachA.id,
    visibility: 'private',
    status: 'draft',
  })
  check(!ownSituationError, 'coach propriétaire: création draft situation autorisée', formatPostgrestError(ownSituationError))
  const { data: ownSituation } = await clients.coachA.from('situations').select('id, version, updated_at').eq('id', ownSituationId).single()

  const { error: ownerUpdateError } = await clients.coachA
    .from('sessions').update({ title: 'Draft propriétaire modifié', updated_at: '2000-01-01T00:00:00.000Z' }).eq('id', ownSessionId).select('id, version, updated_at')
  check(ownerUpdateError?.code === '42501', 'coach propriétaire: UPDATE direct session refusé au profit de la RPC', formatPostgrestError(ownerUpdateError))
  const { data: unchangedSession } = await clients.coachA.from('sessions').select('version,updated_at').eq('id', ownSessionId).single()
  check(unchangedSession?.version === 1 && unchangedSession?.updated_at === ownSession?.updated_at, 'session: version et updated_at inchangés après UPDATE direct refusé')

  const { error: ownerSituationUpdateError } = await clients.coachA
    .from('situations').update({ title: 'Draft situation modifié', updated_at: '2000-01-01T00:00:00.000Z' }).eq('id', ownSituationId).select('id, version, updated_at')
  check(ownerSituationUpdateError?.code === '42501', 'coach propriétaire: UPDATE direct situation refusé', formatPostgrestError(ownerSituationUpdateError))
  const { data: unchangedSituation } = await clients.coachA.from('situations').select('version,updated_at').eq('id', ownSituationId).single()
  check(unchangedSituation?.version === 1 && unchangedSituation?.updated_at === ownSituation?.updated_at, 'situation: version et updated_at inchangés après UPDATE direct refusé')

  const { error: sameTeamUpdateError } = await clients.coachSameTeam
    .from('sessions').update({ title: 'Prise de contrôle refusée' }).eq('id', sessionA).select('id')
  check(sameTeamUpdateError?.code === '42501', 'coach même équipe: modification session autre coach refusée')

  const { error: ownershipTakeoverError } = await clients.coachSameTeam
    .from('sessions')
    .update({ owner_id: fixtureState.accounts.coachSameTeam.id, coach_id: fixtureState.accounts.coachSameTeam.id })
    .eq('id', sessionA).select('id')
  check(ownershipTakeoverError?.code === '42501', 'coach même équipe: prise owner_id/coach_id refusée')

  const { error: situationTakeoverError } = await clients.coachSameTeam
    .from('situations')
    .update({ owner_id: fixtureState.accounts.coachSameTeam.id, created_by: fixtureState.accounts.coachSameTeam.id })
    .eq('id', situationA).select('id')
  check(situationTakeoverError?.code === '42501', 'coach même équipe: prise owner_id/created_by situation refusée')

  const { error: childWriteError } = await clients.coachSameTeam.from('session_situations').insert({
    session_id: sessionA,
    order_index: 2,
    title: 'Bloc interdit',
  })
  check(childWriteError?.code === '42501', 'coach même équipe: écriture enfant session refusée', formatPostgrestError(childWriteError))

  await expectHidden(clients.coachSameTeam, 'session_situations', sessionSituationA, 'coach même équipe: enfant session privée invisible')
  await expectHidden(clients.coachSameTeam, 'session_tags', sessionTagA, 'coach même équipe: tag session privée invisible')
  await expectHidden(clients.coachSameTeam, 'situation_tags', situationTagA, 'coach même équipe: tag situation privée invisible')

  const fileId = crypto.randomUUID()
  const importId = crypto.randomUUID()
  const logId = crypto.randomUUID()
  const { error: ownerChildrenError } = await clients.coachA.from('session_files').insert({
    id: fileId, session_id: ownSessionId, file_name: 'fixture.txt', file_type: 'text/plain',
  })
  const { error: ownerImportError } = await clients.coachA.from('session_imports').insert({
    id: importId, session_id: ownSessionId, situation_id: ownSituationId, created_by: fixtureState.accounts.coachA.id,
  })
  const { error: ownerLogError } = await clients.coachA.from('session_visibility_logs').insert({
    id: logId, session_id: ownSessionId, action: 'fixture', user_id: fixtureState.accounts.coachA.id,
  })
  check(!ownerChildrenError && !ownerImportError, 'coach propriétaire: fichiers et imports de draft autorisés')
  check(ownerLogError?.code === '42501', 'coach propriétaire: fabrication directe de log audit refusée', formatPostgrestError(ownerLogError))
  await expectHidden(clients.coachSameTeam, 'session_files', fileId, 'coach même équipe: fichier session privée invisible')
  await expectHidden(clients.coachSameTeam, 'session_imports', importId, 'coach même équipe: import privé invisible')
  await expectHidden(clients.coachSameTeam, 'session_visibility_logs', logId, 'coach même équipe: log session privée invisible')
  const { error: foreignFileError } = await clients.coachSameTeam.from('session_files').insert({
    session_id: sessionA, file_name: 'interdit.txt', file_type: 'text/plain',
  })
  check(foreignFileError?.code === '42501', 'coach même équipe: écriture fichier autre coach refusée', formatPostgrestError(foreignFileError))

  const { error: publishedUpdateError } = await clients.coachA
    .from('sessions').update({ title: 'Publication altérée' }).eq('id', sessionPublishedA).select('id')
  check(publishedUpdateError?.code === '42501', 'coach propriétaire: session published protégée')
  const { error: archivedUpdateError } = await clients.coachA
    .from('sessions').update({ title: 'Archive altérée' }).eq('id', sessionArchivedA).select('id')
  check(archivedUpdateError?.code === '42501', 'coach propriétaire: session archived protégée')
  const { error: publishedSituationUpdateError } = await clients.coachA
    .from('situations').update({ title: 'Publication altérée' }).eq('id', situationPublishedA).select('id')
  check(publishedSituationUpdateError?.code === '42501', 'coach propriétaire: situation published protégée')
  const { error: archivedSituationUpdateError } = await clients.coachA
    .from('situations').update({ title: 'Archive altérée' }).eq('id', situationArchivedA).select('id')
  check(archivedSituationUpdateError?.code === '42501', 'coach propriétaire: situation archived protégée')

  const { data: coachDelete } = await clients.coachA.from('sessions').delete().eq('id', ownSessionId).select('id')
  check(coachDelete?.length === 0, 'coach propriétaire: hard delete session refusé')
  const { data: coachSituationDelete } = await clients.coachA.from('situations').delete().eq('id', ownSituationId).select('id')
  check(coachSituationDelete?.length === 0, 'coach propriétaire: hard delete situation refusé')

  const { error: invalidVisibilityError } = await clients.admin.from('sessions').insert({
    id: crypto.randomUUID(), title: 'Visibilité invalide', visibility: 'club_reference', status: 'draft',
  })
  check(invalidVisibilityError?.code === '23514', 'sessions: visibilité non canonique rejetée', formatPostgrestError(invalidVisibilityError))
  const { error: invalidStatusError } = await clients.admin.from('situations').insert({
    id: crypto.randomUUID(), title: 'Statut invalide', visibility: 'private', status: 'ready-court',
  })
  check(invalidStatusError?.code === '23514', 'situations: statut non canonique rejeté', formatPostgrestError(invalidStatusError))

  const { error: duplicateOrderError } = await clients.coachA.from('session_situations').insert({
    session_id: sessionA, order_index: 1, title: 'Ordre dupliqué',
  })
  check(duplicateOrderError?.code === '42501', 'session_situations: écriture directe refusée', formatPostgrestError(duplicateOrderError))
  const { error: duplicateSessionTagError } = await clients.coachA.from('session_tags').insert({
    session_id: sessionA, tag: 'rls-session-a',
  })
  check(duplicateSessionTagError?.code === '42501', 'session_tags: écriture directe refusée', formatPostgrestError(duplicateSessionTagError))
  const { error: duplicateSituationTagError } = await clients.coachA.from('situation_tags').insert({
    situation_id: situationA, tag: 'rls-situation-a',
  })
  check(duplicateSituationTagError?.code === '23505', 'situation_tags: doublon tag rejeté', formatPostgrestError(duplicateSituationTagError))

  await clients.admin.from('sessions').insert([
    { id: adminDeleteId, title: 'Suppression admin', visibility: 'private', status: 'draft' },
    { id: managerDeleteId, title: 'Suppression RT', visibility: 'private', status: 'draft' },
  ])
  const { data: adminDeleted } = await clients.admin.from('sessions').delete().eq('id', adminDeleteId).select('id')
  check(adminDeleted?.length === 1, 'admin: hard delete session autorisé')
  const { data: managerDeleted } = await clients.technicalManager.from('sessions').delete().eq('id', managerDeleteId).select('id')
  check(managerDeleted?.length === 1, 'responsable technique: hard delete session autorisé')

  await clients.admin.from('situations').insert([
    { id: adminSituationDeleteId, title: 'Suppression situation admin', visibility: 'private', status: 'draft' },
    { id: managerSituationDeleteId, title: 'Suppression situation RT', visibility: 'private', status: 'draft' },
  ])
  const { data: adminSituationDeleted } = await clients.admin.from('situations').delete().eq('id', adminSituationDeleteId).select('id')
  check(adminSituationDeleted?.length === 1, 'admin: hard delete situation autorisé')
  const { data: managerSituationDeleted } = await clients.technicalManager.from('situations').delete().eq('id', managerSituationDeleteId).select('id')
  check(managerSituationDeleted?.length === 1, 'responsable technique: hard delete situation autorisé')

  await clients.admin.from('sessions').delete().eq('id', ownSessionId)
  await clients.admin.from('situations').delete().eq('id', ownSituationId)

  const { data: sameTeamAssignment } = await clients.admin
    .from('team_staff_assignments')
    .select('id')
    .eq('team_id', teamA)
    .eq('profile_id', fixtureState.accounts.coachSameTeam.id)
    .eq('assignment_role', 'assistant_coach')
    .eq('is_active', true)
    .single()
  const { error: sameTeamCleanupError } = await clients.admin.rpc('remove_team_staff', {
    target_assignment_id: sameTeamAssignment?.id,
  })
  check(!sameTeamCleanupError, 'fixture coach même équipe retirée avant les scénarios staff historiques', formatPostgrestError(sameTeamCleanupError))
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

  // GO-LIVE 07E — une occurrence canonique est vérifiée et créée sans relevé implicite.
  const planningLocation = `Salle occurrence ${crypto.randomUUID()}`
  const occurrenceWeek = Number.parseInt(crypto.randomUUID().slice(0, 8), 16) % 520
  const occurrenceInstant = new Date(Date.UTC(2030, 0, 2 + (occurrenceWeek * 7)))
  const occurrenceDate = occurrenceInstant.toISOString().slice(0, 10)
  const legacyInstant = new Date(occurrenceInstant)
  legacyInstant.setUTCDate(legacyInstant.getUTCDate() + 7)
  const legacyDate = legacyInstant.toISOString().slice(0, 10)
  const { data: planningSlot, error: planningSlotError } = await clients.admin.rpc('save_training_slot', {
    target_slot_id: null, target_team_id: teamA, target_season: 'RLS-TEST', target_weekday: 3,
    target_start_time: '20:30', target_end_time: '22:00', target_location_name: planningLocation,
    target_valid_from: occurrenceDate, target_valid_until: null, allow_conflict: false,
  })
  check(!planningSlotError && planningSlot?.ok === true, 'fixture occurrence: créneau canonique créé localement', formatPostgrestError(planningSlotError))
  const occurrencePayload = {
    team_id: teamA, training_slot_id: planningSlot?.slot_id, session_date: occurrenceDate,
    title: `Entraînement · ${planningLocation}`, session_type: 'entrainement',
    start_time: '20:30', end_time: '22:00', location_name: planningLocation,
  }
  const firstOpen = await clients.coachA.rpc('create_attendance_session_idempotent', { session_payload: occurrencePayload })
  const secondOpen = await clients.coachA.rpc('create_attendance_session_idempotent', { session_payload: occurrencePayload })
  check(!firstOpen.error && firstOpen.data?.created === true, 'occurrence: première ouverture crée une séance', formatPostgrestError(firstOpen.error))
  check(!secondOpen.error && secondOpen.data?.created === false && secondOpen.data?.id === firstOpen.data?.id, 'occurrence: réouverture idempotente sans doublon', formatPostgrestError(secondOpen.error))
  const { data: occurrenceRows } = await clients.coachA.from('attendance_sessions')
    .select('id,team_id,training_slot_id,session_date,start_time,end_time,location_name')
    .eq('id', firstOpen.data?.id)
  check(occurrenceRows?.length === 1 && occurrenceRows[0].training_slot_id === planningSlot?.slot_id, 'occurrence: identité planning persistée intégralement')
  const { data: implicitRecords } = await clients.coachA.from('attendance_records').select('id').eq('session_id', firstOpen.data?.id)
  check(implicitRecords?.length === 0, 'occurrence: aucun relevé de présence créé automatiquement')

  const wrongLocation = await clients.coachA.rpc('create_attendance_session_idempotent', {
    session_payload: { ...occurrencePayload, location_name: 'Lieu falsifié' },
  })
  check(wrongLocation.error?.code === '22023', 'occurrence: lieu non canonique refusé', formatPostgrestError(wrongLocation.error))
  const unauthorizedOpen = await clients.member.rpc('create_attendance_session_idempotent', { session_payload: occurrencePayload })
  check(unauthorizedOpen.error?.code === '42501', 'occurrence: rôle non autorisé refusé', formatPostgrestError(unauthorizedOpen.error))

  const legacyPayload = { ...occurrencePayload, training_slot_id: null, session_date: legacyDate }
  const legacyOpen = await clients.coachA.rpc('create_attendance_session_idempotent', { session_payload: legacyPayload })
  check(!legacyOpen.error, 'fixture historique compatible: appel manuel créé', formatPostgrestError(legacyOpen.error))
  const incompatibleOpen = await clients.coachA.rpc('create_attendance_session_idempotent', {
    session_payload: { ...occurrencePayload, session_date: legacyDate },
  })
  check(incompatibleOpen.error?.code === '22023', 'occurrence: appel historique sans training_slot_id refusé fail-closed', formatPostgrestError(incompatibleOpen.error))
  await clients.admin.rpc('deactivate_training_slot', { target_slot_id: planningSlot?.slot_id })

  const contractPayload = (trainingSlotId, sessionDate, overrides = {}) => ({
    team_id: teamA, training_slot_id: trainingSlotId, session_date: sessionDate,
    title: 'Occurrence contractuelle RLS', session_type: 'entrainement',
    start_time: '20:30', end_time: '22:00', location_name: 'Contrat RLS', ...overrides,
  })
  const countSessionsForSlot = async (slotId) => {
    const { count, error } = await clients.coachA.from('attendance_sessions')
      .select('id', { count: 'exact', head: true }).eq('training_slot_id', slotId)
    return { count, error }
  }

  const seasonBefore = await countSessionsForSlot(attendanceSlotSeasonMismatch)
  const seasonMismatch = await clients.coachA.rpc('create_attendance_session_idempotent', {
    session_payload: contractPayload(attendanceSlotSeasonMismatch, '2035-01-10', { location_name: 'Saison RLS' }),
  })
  const seasonAfter = await countSessionsForSlot(attendanceSlotSeasonMismatch)
  check(seasonMismatch.error?.code === '22023' && seasonBefore.count === 0 && seasonAfter.count === 0,
    'occurrence: saison du créneau différente de teams.season refusée sans séance', formatPostgrestError(seasonMismatch.error))

  const cancelled = await clients.coachA.rpc('create_attendance_session_idempotent', {
    session_payload: contractPayload(attendanceSlotCancelled, '2035-01-10', { start_time: '18:00', end_time: '19:00', location_name: 'Ne doit pas ressusciter' }),
  })
  const cancelledCount = await countSessionsForSlot(attendanceSlotCancelled)
  check(cancelled.error?.code === '22023' && cancelledCount.count === 0,
    'occurrence: cancelled reste refusée malgré ses overrides et ne crée aucune séance', formatPostgrestError(cancelled.error))

  const exceptionCases = [
    ['modified début seul', attendanceSlotStart, '2035-01-17', { start_time: '19:30', end_time: '22:00', location_name: 'Début RLS' }],
    ['modified fin seule', attendanceSlotEnd, '2035-01-24', { start_time: '20:30', end_time: '22:30', location_name: 'Fin RLS' }],
    ['modified lieu seul normalisé', attendanceSlotLocation, '2035-01-31', { start_time: '20:30', end_time: '22:00', location_name: ' Annexe RLS ' }],
    ['modified combinée', attendanceSlotCombined, '2035-02-07', { start_time: '19:00', end_time: '21:00', location_name: 'Combiné effectif' }],
    ['moved même date', attendanceSlotMoved, '2035-02-14', { start_time: '18:30', end_time: '20:00', location_name: 'Moved effectif' }],
  ]
  for (const [label, slotId, sessionDate, effective] of exceptionCases) {
    const obsolete = await clients.coachA.rpc('create_attendance_session_idempotent', {
      session_payload: contractPayload(slotId, sessionDate, { location_name: label.includes('lieu') ? 'Lieu RLS' : label.includes('début') ? 'Début RLS' : label.includes('fin') ? 'Fin RLS' : label.includes('combinée') ? 'Combiné RLS' : 'Moved RLS' }),
    })
    check(obsolete.error?.code === '22023', `${label}: valeurs canoniques devenues obsolètes refusées`, formatPostgrestError(obsolete.error))
    const firstEffective = await clients.coachA.rpc('create_attendance_session_idempotent', {
      session_payload: contractPayload(slotId, sessionDate, effective),
    })
    const secondEffective = await clients.coachA.rpc('create_attendance_session_idempotent', {
      session_payload: contractPayload(slotId, sessionDate, effective),
    })
    check(!firstEffective.error && firstEffective.data?.created === true
      && !secondEffective.error && secondEffective.data?.created === false
      && firstEffective.data?.id === secondEffective.data?.id,
    `${label}: valeurs effectives acceptées et réouverture idempotente`, formatPostgrestError(firstEffective.error || secondEffective.error))
  }

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
