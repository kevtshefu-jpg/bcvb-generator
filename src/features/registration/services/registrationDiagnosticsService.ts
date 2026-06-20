import { supabase } from '../../../lib/supabase'
import {
  isMissingColumnError,
  isRelationMissingError,
  isRlsError,
  serializeSupabaseError,
} from './publicRegistrationService'

export type RegistrationDiagnosticResult = {
  key: string
  label: string
  status: 'ok' | 'warning' | 'error'
  message: string
}

function result(
  key: string,
  label: string,
  status: RegistrationDiagnosticResult['status'],
  message: string,
): RegistrationDiagnosticResult {
  return { key, label, status, message }
}

async function testTableRead(table: string, label: string) {
  const { error } = await supabase
    .from(table)
    .select('*')
    .limit(1)

  if (!error) {
    return result(`${table}-read`, label, 'ok', 'Lecture disponible.')
  }

  if (isRelationMissingError(error)) {
    return result(`${table}-read`, label, 'warning', 'Table absente ou non exposée dans le schéma Supabase.')
  }

  if (isRlsError(error)) {
    return result(`${table}-read`, label, 'warning', 'Lecture limitée par les policies RLS.')
  }

  return result(`${table}-read`, label, 'error', serializeSupabaseError(error))
}

async function cleanupDiagnosticRow(id: string | null, email: string) {
  if (id) {
    const { error } = await supabase
      .from('registration_requests')
      .delete()
      .eq('id', id)

    if (!error) return
    console.warn('[registrationDiagnostics] suppression diagnostic par id impossible :', error)
  }

  const { error: deleteByEmailError } = await supabase
    .from('registration_requests')
    .delete()
    .eq('email', email)

  if (!deleteByEmailError) return

  console.warn('[registrationDiagnostics] suppression diagnostic par email impossible :', deleteByEmailError)

  const { error: updateError } = await supabase
    .from('registration_requests')
    .update({ status: 'diagnostic' })
    .eq('email', email)

  if (updateError) {
    console.warn('[registrationDiagnostics] marquage diagnostic impossible :', updateError)
  }
}

async function testRegistrationInsert() {
  const email = `diagnostic-${Date.now()}@bcvb.local`
  const fullPayload = {
    first_name: 'Diagnostic',
    last_name: 'BCVB',
    email,
    phone: null,
    birth_year: 2000,
    category_requested: 'Diagnostic',
    role_requested: 'member',
    requested_team: null,
    notes: 'Ligne créée par le diagnostic admin puis supprimée si possible.',
    status: 'diagnostic',
  }

  const { data, error } = await supabase
    .from('registration_requests')
    .insert(fullPayload)
    .select('id')
    .single()

  if (!error) {
    await cleanupDiagnosticRow(String(data?.id || ''), email)
    return result(
      'registration-insert',
      'registration_requests insertion',
      'ok',
      'Insertion complète possible.',
    )
  }

  console.warn('[registrationDiagnostics] insertion complète échouée :', error)

  if (isRelationMissingError(error) || isRlsError(error)) {
    return result(
      'registration-insert',
      'registration_requests insertion',
      'error',
      serializeSupabaseError(error),
    )
  }

  if (!isMissingColumnError(error)) {
    return result(
      'registration-insert',
      'registration_requests insertion',
      'error',
      serializeSupabaseError(error),
    )
  }

  const { error: minimalError } = await supabase
    .from('registration_requests')
    .insert({
      email,
      status: 'diagnostic',
    })

  if (minimalError) {
    return result(
      'registration-insert',
      'registration_requests insertion',
      'error',
      `Fallback minimal échoué : ${serializeSupabaseError(minimalError)}`,
    )
  }

  await cleanupDiagnosticRow(null, email)

  return result(
    'registration-insert',
    'registration_requests insertion',
    'warning',
    'Insertion possible seulement en mode minimal. Des colonnes attendues manquent.',
  )
}

async function testNotificationFunction() {
  const { error } = await supabase.functions.invoke('notify-profile-request', {
    body: {
      diagnostic: true,
      email: `diagnostic-${Date.now()}@bcvb.local`,
      fullName: 'Diagnostic BCVB',
      requestedRole: 'member',
      requestedCategoryId: 'Diagnostic',
      message: 'Diagnostic fonction notification.',
    },
  })

  if (!error) {
    return result(
      'notification-function',
      'notify-profile-request',
      'ok',
      'Edge Function joignable.',
    )
  }

  return result(
    'notification-function',
    'notify-profile-request',
    'warning',
    `Fonction secondaire indisponible ou refusée : ${serializeSupabaseError(error)}`,
  )
}

export async function runRegistrationDiagnostics() {
  const diagnostics: RegistrationDiagnosticResult[] = []

  diagnostics.push(await testTableRead('registration_requests', 'registration_requests lecture'))
  diagnostics.push(await testRegistrationInsert())
  diagnostics.push(await testTableRead('profile_requests', 'profile_requests'))
  diagnostics.push(await testTableRead('admin_notifications', 'admin_notifications'))
  diagnostics.push(await testNotificationFunction())

  return diagnostics
}
