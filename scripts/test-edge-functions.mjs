import { createClient } from '@supabase/supabase-js'
import { assertSafeTestEnvironment, loadFixtureState, loadLocalEnv } from './rls-test-config.mjs'

const config = await loadLocalEnv()
const projectRef = assertSafeTestEnvironment(config, {
  operation: 'tests Edge Functions',
  requireServiceRole: true,
})
const state = await loadFixtureState()
if (!state) throw new Error('Fixtures absentes. Exécuter npm run seed:rls.')
if (state.target?.projectRef !== projectRef) throw new Error('Les fixtures ne correspondent pas à la cible actuelle. Relancer seed:rls.')

async function clientFor(name) {
  const account = state.accounts[name]
  const client = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { error } = await client.auth.signInWithPassword({ email: account.email, password: account.password })
  if (error) throw new Error(`${name}: connexion impossible : ${error.message}`)
  return client
}

function assert(condition, message) {
  if (!condition) throw new Error(`FAIL ${message}`)
  process.stdout.write(`PASS ${message}\n`)
}

function assertDenied(result, message) {
  const status = result.error?.context?.status
  const payloadRejected = result.data?.ok === false || result.data?.success === false
  const explicitHttpRejection = status === 401 || status === 403
  assert(payloadRejected || explicitHttpRejection, `${message}${status ? ` (HTTP ${status})` : ''}`)
}

const admin = await clientFor('admin')
const member = await clientFor('member')
const inactive = await clientFor('inactive')
const randomId = crypto.randomUUID()
const serviceClient = createClient(config.url, config.serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

if (projectRef !== 'local') {
  throw new Error('Les tests Edge GO-01C modifient temporairement une fixture et sont autorisés uniquement en local.')
}

async function invokeWithoutJwt(functionName, body = {}) {
  const response = await fetch(`${config.url}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: { apikey: config.anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  let data = null
  try { data = await response.json() } catch { /* La réponse HTTP suffit au contrôle. */ }
  return { status: response.status, data }
}

async function accessTokenFor(client) {
  const { data, error } = await client.auth.getSession()
  if (error || !data.session?.access_token) throw new Error(`JWT de test indisponible : ${error?.message || 'session absente'}`)
  return data.session.access_token
}

async function invokeCreateApprovedUser({ token, body = { requestId: randomId } } = {}) {
  const response = await fetch(`${config.url}/functions/v1/create-approved-user`, {
    method: 'POST',
    headers: {
      apikey: config.anonKey,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  const responseBody = await response.text()
  let data = null
  try {
    data = responseBody ? JSON.parse(responseBody) : null
  } catch {
    data = responseBody ? { message: responseBody } : null
  }
  return { status: response.status, data }
}

async function invokeAdminDelete({ token, body = { profileId: randomId, action: 'delete' } } = {}) {
  const response = await fetch(`${config.url}/functions/v1/admin-delete-profile`, {
    method: 'POST',
    headers: {
      apikey: config.anonKey,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  const responseBody = await response.text()
  let data = null
  try {
    data = responseBody ? JSON.parse(responseBody) : null
  } catch {
    data = responseBody ? { message: responseBody } : null
  }
  return { status: response.status, data }
}

function describeHttpResult(label, result) {
  const code = result.data?.code ?? 'absent'
  const message = result.data?.message ?? result.data?.error ?? 'absent'
  const details = result.data?.details ?? 'absent'
  process.stdout.write(`${label}: HTTP ${result.status}, code=${code}, message=${message}, details=${details}\n`)
}

async function authUserCount() {
  const { data, error } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw new Error(`Comptage Auth local impossible : ${error.message}`)
  return data.users.length
}

{
  const result = await invokeWithoutJwt('generate-ai-document', {})
  assert([401, 403].includes(result.status) || result.data?.success === false, 'JWT absent refusé par generate-ai-document')
}

{
  const result = await member.functions.invoke('generate-ai-document', { body: {} })
  assertDenied(result, 'membre refusé par generate-ai-document')
}

{
  const result = await inactive.functions.invoke('generate-ai-document', { body: {} })
  assertDenied(result, 'profil inactif refusé par generate-ai-document')
}

{
  const { data, error } = await admin.functions.invoke('generate-ai-document', { body: {} })
  assert(!error && data?.success === true, 'admin autorisé par generate-ai-document')
}

{
  const usersBeforeRefusals = await authUserCount()
  const adminToken = await accessTokenFor(admin)
  const memberToken = await accessTokenFor(member)
  const inactiveToken = await accessTokenFor(inactive)

  const cases = [
    ['JWT absent', await invokeCreateApprovedUser(), 401],
    ['JWT invalide', await invokeCreateApprovedUser({ token: 'jwt-invalide' }), 401],
    ['membre', await invokeCreateApprovedUser({ token: memberToken }), 403],
    ['profil inactif', await invokeCreateApprovedUser({ token: inactiveToken }), 403],
    ['admin', await invokeCreateApprovedUser({ token: adminToken }), 404],
    ['payload invalide', await invokeCreateApprovedUser({ token: adminToken, body: {} }), 400],
  ]

  for (const [label, result, expectedStatus] of cases) {
    describeHttpResult(`create-approved-user — ${label}`, result)
    assert(result.status === expectedStatus, `${label}: statut HTTP ${expectedStatus}`)
  }

  assert(cases[2][1].data?.code === 'ROLE_FORBIDDEN', 'membre refusé avec un code explicite')
  assert(cases[3][1].data?.code === 'PROFILE_FORBIDDEN', 'profil inactif refusé avec un code explicite')
  assert(cases[4][1].data?.code === 'REQUEST_NOT_FOUND', 'admin autorisé jusqu’au contrôle métier')
  assert(cases[5][1].data?.code === 'INVALID_PAYLOAD', 'payload invalide refusé explicitement')
  assert(await authUserCount() === usersBeforeRefusals, 'aucun utilisateur Auth créé lors des refus')
}

{
  const adminToken = await accessTokenFor(admin)
  const memberToken = await accessTokenFor(member)
  const inactiveToken = await accessTokenFor(inactive)
  const authCountBefore = await authUserCount()

  const refusalCases = [
    ['JWT absent', await invokeAdminDelete(), 401],
    ['JWT invalide', await invokeAdminDelete({ token: 'jwt-invalide' }), 401],
    ['membre', await invokeAdminDelete({ token: memberToken }), 403],
    ['profil inactif', await invokeAdminDelete({ token: inactiveToken }), 403],
    ['payload invalide', await invokeAdminDelete({ token: adminToken, body: {} }), 400],
    ['profil absent', await invokeAdminDelete({ token: adminToken }), 404],
  ]

  for (const [label, result, expectedStatus] of refusalCases) {
    describeHttpResult(`admin-delete-profile — ${label}`, result)
    assert(result.status === expectedStatus, `suppression ${label}: HTTP ${expectedStatus}`)
  }

  assert(refusalCases[2][1].data?.code === 'ROLE_FORBIDDEN', 'suppression membre refusée explicitement')
  assert(refusalCases[3][1].data?.code === 'PROFILE_FORBIDDEN', 'suppression profil inactif refusée explicitement')
  assert(refusalCases[5][1].data?.code === 'PROFILE_NOT_FOUND', 'profil cible absent signalé explicitement')
  assert(await authUserCount() === authCountBefore, 'aucun compte Auth supprimé lors des refus initiaux')

  const { error: forgedAdminActorError } = await admin.rpc('delete_profile_atomically', {
    actor_profile_id: state.accounts.member.id,
    target_profile_id: randomId,
  })
  assert(forgedAdminActorError?.code === 'PT403', 'un admin ne peut pas falsifier actor_profile_id')

  const { error: forgedMemberActorError } = await member.rpc('delete_profile_atomically', {
    actor_profile_id: state.accounts.admin.id,
    target_profile_id: randomId,
  })
  assert(forgedMemberActorError?.code === 'PT403', 'un membre ne peut pas emprunter l’identité d’un admin')

  const { error: serviceRoleRpcError } = await serviceClient.rpc('delete_profile_atomically', {
    actor_profile_id: state.accounts.admin.id,
    target_profile_id: randomId,
  })
  assert(serviceRoleRpcError?.code === '42501', 'la service role ne peut pas appeler directement la RPC')

  const concurrentAdmins = []
  try {
    for (const suffix of ['a', 'b']) {
      const email = `rls.concurrent-admin-${suffix}-${crypto.randomUUID()}@bcvb.test`
      const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
        email,
        password: `Rls-${crypto.randomUUID()}!9a`,
        email_confirm: true,
        user_metadata: { rls_test: true },
      })
      if (authError || !authData.user) throw new Error(`Admin concurrent impossible : ${authError?.message || 'absent'}`)
      concurrentAdmins.push(authData.user.id)
      const { error: profileError } = await serviceClient.from('profiles').insert({
        id: authData.user.id,
        email,
        full_name: `Admin concurrent ${suffix.toUpperCase()}`,
        role: 'admin',
        is_active: true,
        profile_status: 'active',
      })
      if (profileError) throw new Error(`Profil admin concurrent impossible : ${profileError.message}`)
    }

    const { error: fixtureAdminSuspensionError } = await serviceClient
      .from('profiles')
      .update({ is_active: false, profile_status: 'suspended' })
      .eq('id', state.accounts.admin.id)
    if (fixtureAdminSuspensionError) throw new Error(`Préparation concurrence impossible : ${fixtureAdminSuspensionError.message}`)

    const concurrentResults = await Promise.all(concurrentAdmins.map((id) =>
      serviceClient.from('profiles').update({ is_active: false, profile_status: 'suspended' }).eq('id', id),
    ))
    const successfulMutations = concurrentResults.filter(({ error }) => !error)
    const rejectedMutations = concurrentResults.filter(({ error }) => error?.code === 'PT409')
    assert(successfulMutations.length === 1, 'une seule mutation admin concurrente est validée')
    assert(rejectedMutations.length === 1, 'la seconde mutation admin concurrente est refusée en PT409')
  } finally {
    await serviceClient
      .from('profiles')
      .update({ is_active: true, profile_status: 'active' })
      .eq('id', state.accounts.admin.id)
    for (const id of concurrentAdmins) {
      await serviceClient.from('profiles').delete().eq('id', id)
      await serviceClient.auth.admin.deleteUser(id)
    }
  }

  const temporaryAdminEmail = `rls.delete-admin-${crypto.randomUUID()}@bcvb.test`
  const { data: temporaryAdminData, error: temporaryAdminError } = await serviceClient.auth.admin.createUser({
    email: temporaryAdminEmail,
    password: `Rls-${crypto.randomUUID()}!9a`,
    email_confirm: true,
    user_metadata: { rls_test: true },
  })
  if (temporaryAdminError || !temporaryAdminData.user) throw new Error(`Admin temporaire impossible : ${temporaryAdminError?.message || 'absent'}`)
  const temporaryAdminId = temporaryAdminData.user.id
  const { error: temporaryAdminProfileError } = await serviceClient.from('profiles').insert({
    id: temporaryAdminId,
    email: temporaryAdminEmail,
    full_name: 'Admin suppression temporaire',
    role: 'admin',
    is_active: true,
    profile_status: 'active',
  })
  if (temporaryAdminProfileError) throw new Error(`Profil admin temporaire impossible : ${temporaryAdminProfileError.message}`)

  try {
    const selfDelete = await invokeAdminDelete({
      token: adminToken,
      body: { profileId: state.accounts.admin.id, action: 'delete' },
    })
    describeHttpResult('admin-delete-profile — auto-suppression', selfDelete)
    assert(selfDelete.status === 403 && selfDelete.data?.code === 'SELF_ACTION_FORBIDDEN', 'auto-suppression refusée en 403')
  } finally {
    await serviceClient.from('profiles').delete().eq('id', temporaryAdminId)
    await serviceClient.auth.admin.deleteUser(temporaryAdminId)
  }

  const soleAdminSelfDelete = await invokeAdminDelete({
    token: adminToken,
    body: { profileId: state.accounts.admin.id, action: 'delete' },
  })
  describeHttpResult('admin-delete-profile — auto-suppression du dernier administrateur', soleAdminSelfDelete)
  assert(soleAdminSelfDelete.status === 403 && soleAdminSelfDelete.data?.code === 'SELF_ACTION_FORBIDDEN', 'auto-action prioritaire sur la protection du dernier admin')

  const blockedTargetId = state.accounts.coachA.id
  const blockingDelete = await invokeAdminDelete({
    token: adminToken,
    body: { profileId: blockedTargetId, action: 'delete' },
  })
  describeHttpResult('admin-delete-profile — dépendance métier', blockingDelete)
  assert(blockingDelete.status === 409 && blockingDelete.data?.code === 'DEPENDENCY_CONFLICT', 'dépendance métier refusée en 409')
  const [{ data: blockedProfile }, blockedAuth] = await Promise.all([
    serviceClient.from('profiles').select('id').eq('id', blockedTargetId).maybeSingle(),
    serviceClient.auth.admin.getUserById(blockedTargetId),
  ])
  assert(Boolean(blockedProfile && blockedAuth.data.user), 'profil et compte Auth conservés après conflit')

  const orphanProfileId = crypto.randomUUID()
  const { error: orphanProfileError } = await serviceClient.from('profiles').insert({
    id: orphanProfileId,
    email: `rls.orphan-${orphanProfileId}@bcvb.test`,
    full_name: 'Profil Auth orphelin local',
    role: 'member',
    is_active: false,
    profile_status: 'suspended',
  })
  if (orphanProfileError) throw new Error(`Profil orphelin impossible : ${orphanProfileError.message}`)

  try {
    const orphanDelete = await invokeAdminDelete({
      token: adminToken,
      body: { profileId: orphanProfileId, action: 'delete' },
    })
    describeHttpResult('admin-delete-profile — rollback compte Auth absent', orphanDelete)
    assert(orphanDelete.status === 409, 'absence du compte Auth traitée comme un conflit cohérent')
    const [{ data: preservedOrphan }, { data: rolledBackAudit }] = await Promise.all([
      serviceClient.from('profiles').select('id').eq('id', orphanProfileId).maybeSingle(),
      serviceClient.from('admin_notifications').select('id').eq('type', 'profile_deleted').contains('metadata', { target_id: orphanProfileId }),
    ])
    assert(Boolean(preservedOrphan), 'profil restauré après échec de suppression Auth')
    assert(rolledBackAudit?.length === 0, 'audit annulé avec la transaction en échec')
  } finally {
    await serviceClient.from('profiles').delete().eq('id', orphanProfileId)
  }

  const deletableEmail = `rls.deletable-${crypto.randomUUID()}@bcvb.test`
  const { data: deletableAuth, error: deletableAuthError } = await serviceClient.auth.admin.createUser({
    email: deletableEmail,
    password: `Rls-${crypto.randomUUID()}!9a`,
    email_confirm: true,
    user_metadata: { rls_test: true },
  })
  if (deletableAuthError || !deletableAuth.user) throw new Error(`Compte supprimable impossible : ${deletableAuthError?.message || 'absent'}`)
  const deletableId = deletableAuth.user.id
  const { error: deletableProfileError } = await serviceClient.from('profiles').insert({
    id: deletableId,
    email: deletableEmail,
    full_name: 'Profil supprimable local',
    role: 'member',
    is_active: false,
    profile_status: 'suspended',
  })
  if (deletableProfileError) throw new Error(`Profil supprimable impossible : ${deletableProfileError.message}`)

  const deleted = await invokeAdminDelete({
    token: adminToken,
    body: { profileId: deletableId, action: 'delete' },
  })
  describeHttpResult('admin-delete-profile — profil supprimable', deleted)
  assert(deleted.status === 200 && deleted.data?.ok === true, 'profil sans dépendance supprimé après confirmation serveur')
  const [{ data: deletedProfile }, deletedAuthCheck, { data: auditRows }] = await Promise.all([
    serviceClient.from('profiles').select('id').eq('id', deletableId).maybeSingle(),
    serviceClient.auth.admin.getUserById(deletableId),
    serviceClient.from('admin_notifications').select('id').eq('type', 'profile_deleted').contains('metadata', { target_id: deletableId }),
  ])
  assert(!deletedProfile && !deletedAuthCheck.data.user, 'suppression Auth et profil confirmée')
  assert(auditRows?.length === 1, 'suppression définitive journalisée')
}

async function readProfile(profileId) {
  const { data, error } = await admin
    .from('profiles')
    .select('id, role, is_active, profile_status')
    .eq('id', profileId)
    .single()
  if (error) throw new Error(`Lecture de contrôle du profil impossible : ${error.message}`)
  return data
}

{
  const targetId = state.accounts.member.id
  const initial = await readProfile(targetId)

  try {
    const suspended = await admin.functions.invoke('admin-delete-profile', {
      body: { profileId: targetId, action: 'deactivate' },
    })
    assert(!suspended.error && suspended.data?.ok === true, 'admin peut suspendre un profil de test')
    const suspendedProfile = await readProfile(targetId)
    assert(
      suspendedProfile.is_active === false && suspendedProfile.profile_status === 'suspended',
      'suspension synchronise is_active et profile_status',
    )

    const reactivated = await admin.functions.invoke('admin-delete-profile', {
      body: { profileId: targetId, action: 'reactivate' },
    })
    assert(!reactivated.error && reactivated.data?.ok === true, 'admin peut réactiver un profil de test')
    const reactivatedProfile = await readProfile(targetId)
    assert(
      reactivatedProfile.is_active === true && reactivatedProfile.profile_status === 'active',
      'réactivation synchronise is_active et profile_status',
    )

    const roleUpdated = await admin.functions.invoke('admin-delete-profile', {
      body: { profileId: targetId, action: 'update_role', role: 'coach' },
    })
    assert(!roleUpdated.error && roleUpdated.data?.ok === true, 'admin peut modifier un rôle autorisé')
    assert((await readProfile(targetId)).role === 'coach', 'rôle modifié confirmé par la base locale')

    const invalidRole = await admin.functions.invoke('admin-delete-profile', {
      body: { profileId: targetId, action: 'update_role', role: 'super_admin' },
    })
    assert(
      invalidRole.error?.context?.status === 400,
      'rôle libre refusé par admin-delete-profile (HTTP 400)',
    )
  } finally {
    const current = await readProfile(targetId)
    if (current.role !== initial.role) {
      await admin.functions.invoke('admin-delete-profile', {
        body: { profileId: targetId, action: 'update_role', role: initial.role },
      })
    }
    if (initial.is_active && !current.is_active) {
      await admin.functions.invoke('admin-delete-profile', {
        body: { profileId: targetId, action: 'reactivate' },
      })
    } else if (!initial.is_active && current.is_active) {
      await admin.functions.invoke('admin-delete-profile', {
        body: { profileId: targetId, action: 'deactivate' },
      })
    }
  }
}

{
  const result = await member.functions.invoke('notify-registration-created', { body: { diagnostic: true } })
  assertDenied(result, 'membre refusé par le diagnostic de notification')
}

{
  const { data, error } = await admin.functions.invoke('notify-registration-created', { body: { diagnostic: true } })
  assert(!error && data?.ok === true && data?.diagnostic === true, 'admin autorisé par le diagnostic de notification')
}

await Promise.all([admin.auth.signOut(), member.auth.signOut(), inactive.auth.signOut()])
process.stdout.write('Tous les tests Edge Functions non destructifs sont passés.\n')
