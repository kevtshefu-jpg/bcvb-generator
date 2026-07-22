import { createClient } from '@supabase/supabase-js'
import { assertSafeTestEnvironment, loadFixtureState, loadLocalEnv } from './rls-test-config.mjs'

const config = await loadLocalEnv()
const projectRef = assertSafeTestEnvironment(config, { operation: 'tests Edge Functions' })
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
  const result = await admin.functions.invoke('create-approved-user', { body: {} })
  const status = result.error?.context?.status
  assert(status === 400 || result.data?.ok === false, 'payload invalide refusé par create-approved-user')
}

{
  const result = await member.functions.invoke('create-approved-user', { body: { requestId: randomId } })
  assertDenied(result, 'membre refusé par create-approved-user')
}

{
  const result = await member.functions.invoke('admin-delete-profile', {
    body: { profileId: state.accounts.admin.id, action: 'deactivate' },
  })
  assertDenied(result, 'membre refusé par admin-delete-profile')
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
