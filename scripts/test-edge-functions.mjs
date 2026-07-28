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
  const result = await member.functions.invoke('admin-delete-profile', {
    body: { profileId: state.accounts.admin.id, action: 'deactivate' },
  })
  assertDenied(result, 'membre refusé par admin-delete-profile')
}

{
  const result = await inactive.functions.invoke('admin-delete-profile', {
    body: { profileId: state.accounts.member.id, action: 'reactivate' },
  })
  assertDenied(result, 'profil inactif refusé par admin-delete-profile')
}

{
  const result = await admin.functions.invoke('admin-delete-profile', {
    body: { profileId: state.accounts.member.id, action: 'unknown-action' },
  })
  assertDenied(result, 'payload invalide refusé par admin-delete-profile')
}

{
  const result = await admin.functions.invoke('admin-delete-profile', {
    body: { profileId: state.accounts.admin.id, action: 'deactivate' },
  })
  assertDenied(result, 'dernier administrateur protégé par admin-delete-profile')
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
