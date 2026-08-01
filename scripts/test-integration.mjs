import { createClient } from '@supabase/supabase-js'
import { assertSafeTestEnvironment, loadFixtureState, loadLocalEnv } from './rls-test-config.mjs'

const config = await loadLocalEnv()
const projectRef = assertSafeTestEnvironment(config, { operation: 'parcours d’intégration', requireServiceRole: true })
const state = await loadFixtureState()
if (!state || state.target?.projectRef !== projectRef) throw new Error('Fixtures absentes ou créées pour une autre cible. Relancer seed:rls.')

const requestId = '70000000-0000-4000-8000-000000000001'
const notificationId = '80000000-0000-4000-8000-000000000001'
const email = 'rls.integration@bcvb.test'
const password = 'Rls-Integration-Only!2026'

const service = createClient(config.url, config.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
const anon = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
const admin = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } })

function pass(message, detail = '') { process.stdout.write(`PASS ${message}${detail ? ` — ${detail}` : ''}\n`) }
function assert(condition, message, detail = '') {
  if (!condition) throw new Error(`FAIL ${message}${detail ? ` — ${detail}` : ''}`)
  pass(message, detail)
}
async function must(resultPromise, message) {
  const result = await resultPromise
  if (result.error) throw new Error(`FAIL ${message} — ${result.error.message}`)
  pass(message)
  return result.data
}

await must(admin.auth.signInWithPassword({
  email: state.accounts.admin.email,
  password: state.accounts.admin.password,
}), 'connexion administrateur')

// Nettoyage ciblé et récupérable uniquement sur les identifiants réservés aux tests.
await must(service.from('admin_notifications').delete().eq('id', notificationId), 'nettoyage de la notification de test')
await must(service.from('registration_requests').delete().eq('id', requestId), 'nettoyage de la demande de test')

await must(anon.from('registration_requests').insert({
  id: requestId,
  first_name: 'Integration',
  last_name: 'RLS',
  email,
  role_requested: 'coach',
  requested_team: 'RLS Team A',
  category_requested: 'U13',
  status: 'pending',
}), 'inscription publique')

const requests = await must(admin.from('registration_requests').select('id,status,email').eq('id', requestId), 'lecture admin de l’inscription')
assert(requests?.length === 1 && requests[0].status === 'pending', 'demande en attente identifiable')

await must(admin.from('admin_notifications').insert({
  id: notificationId,
  type: 'registration_created',
  title: 'Inscription RLS intégration',
  message: 'Notification réservée au test de préproduction.',
  recipient_role: 'admin',
  metadata: { registration_request_id: requestId, rls_test: true },
}), 'création de la notification administrateur')

const { data: adminSession } = await admin.auth.getSession()
async function invokeApproval(body) {
  const response = await fetch(`${config.url}/functions/v1/create-approved-user`, {
    method: 'POST',
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${adminSession.session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  return { status: response.status, data: await response.json() }
}

const approval = await invokeApproval({ requestId, finalRole: 'coach' })
assert(approval.status === 200 && approval.data?.ok === true, 'approbation Edge confirmée', `HTTP ${approval.status}`)
assert(approval.data?.activation_email_status === 'sent' || approval.data?.activation_email_status === 'failed', 'statut email enregistré')

const duplicateApproval = await invokeApproval({ requestId, finalRole: 'coach' })
assert(duplicateApproval.status === 409 && duplicateApproval.data?.code === 'REQUEST_ALREADY_PROCESSED', 'double approbation refusée', `HTTP ${duplicateApproval.status}`)

const approvedRows = await must(service.from('registration_requests').select('status,activation_email_status').eq('id', requestId), 'lecture de la décision serveur')
assert(approvedRows[0]?.status === 'approved', 'demande marquée approuvée par le serveur')

const users = await must(service.auth.admin.listUsers({ page: 1, perPage: 1000 }), 'recherche du compte d’intégration')
let integrationUser = users.users.find((user) => user.email?.toLowerCase() === email)
assert(Boolean(integrationUser), 'création du compte Auth par la fonction Edge')
const updated = await must(service.auth.admin.updateUserById(integrationUser.id, { password, email_confirm: true }), 'simulation locale de l’activation du lien')
integrationUser = updated.user
assert(Boolean(integrationUser?.id), 'identifiant Auth créé')

const profiles = await must(service.from('profiles').select('id,role,is_active').eq('id', integrationUser.id), 'lecture du profil applicatif créé')
assert(profiles.length === 1 && profiles[0].role === 'coach' && profiles[0].is_active === true, 'profil applicatif cohérent')
await must(admin.from('team_staff_assignments').upsert({
  team_id: state.fixtures.teamA, profile_id: integrationUser.id, assignment_role: 'assistant_coach', is_active: true, created_by: state.accounts.admin.id,
}, { onConflict: 'team_id,profile_id,assignment_role' }), 'affectation du coach à Team A')

const integration = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
await must(integration.auth.signInWithPassword({ email, password }), 'connexion du compte approuvé')
const { data: role, error: roleError } = await integration.rpc('current_user_role')
assert(!roleError && role === 'coach', 'rôle du profil approuvé', roleError?.message || String(role))
const { data: accessA, error: accessAError } = await integration.rpc('can_access_team', { target_team_id: state.fixtures.teamA })
const { data: accessB, error: accessBError } = await integration.rpc('can_access_team', { target_team_id: state.fixtures.teamB })
assert(!accessAError && accessA === true, 'lecture autorisée de Team A', accessAError?.message)
assert(!accessBError && accessB === false, 'lecture interdite de Team B', accessBError?.message)

await Promise.all([admin.auth.signOut(), integration.auth.signOut()])
process.stdout.write('Tous les contrôles du parcours d’intégration sont passés.\n')
