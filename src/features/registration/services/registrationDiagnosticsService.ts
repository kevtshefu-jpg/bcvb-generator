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
  hint?: string
}

function result(
  key: string,
  label: string,
  status: RegistrationDiagnosticResult['status'],
  message: string,
  hint?: string,
): RegistrationDiagnosticResult {
  return { key, label, status, message, hint }
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
    return result(
      `${table}-read`,
      label,
      'warning',
      'Table absente ou non exposée dans le schéma Supabase.',
      'Appliquer le script docs/supabase-registration-notifications.sql ou vérifier que la table est bien exposée côté API.',
    )
  }

  if (isRlsError(error)) {
    return result(
      `${table}-read`,
      label,
      'warning',
      'Lecture limitée par les policies RLS.',
      'Vérifier les policies RLS. Une lecture limitée peut être normale, mais les inserts publics doivent rester autorisés.',
    )
  }

  return result(
    `${table}-read`,
    label,
    'error',
    serializeSupabaseError(error),
    'Contrôler les permissions Supabase et le cache de schéma avant de retester.',
  )
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
      'Le formulaire public peut enregistrer une demande avec ses champs principaux.',
    )
  }

  console.warn('[registrationDiagnostics] insertion complète échouée :', error)

  if (isRelationMissingError(error) || isRlsError(error)) {
    return result(
      'registration-insert',
      'registration_requests insertion',
      'error',
      serializeSupabaseError(error),
      'Créer la table registration_requests ou ajuster les policies RLS pour autoriser les demandes publiques.',
    )
  }

  if (!isMissingColumnError(error)) {
    return result(
      'registration-insert',
      'registration_requests insertion',
      'error',
      serializeSupabaseError(error),
      'Le fallback de colonne manquante ne s’applique pas. Lire le message Supabase et corriger la table ou la policy concernée.',
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
      'Même le payload minimal ne passe pas. Vérifier au minimum les colonnes email et status ou la policy INSERT.',
    )
  }

  await cleanupDiagnosticRow(null, email)

  return result(
    'registration-insert',
    'registration_requests insertion',
    'warning',
    'Insertion possible seulement en mode minimal. Des colonnes attendues manquent.',
    'TODO Supabase : ajouter requested_team et les colonnes optionnelles utiles si l’historique legacy doit les conserver.',
  )
}

async function testNotificationFunction() {
  const { error } = await supabase.functions.invoke('notify-registration-created', {
    body: {
      diagnostic: true,
      registrationRequestId: 'diagnostic',
      email: `diagnostic-${Date.now()}@bcvb.local`,
      firstName: 'Diagnostic',
      lastName: 'BCVB',
      fullName: 'Diagnostic BCVB',
      roleRequested: 'member',
      categoryRequested: 'Diagnostic',
      requestedTeam: null,
      phone: null,
    },
  })

  if (!error) {
    return result(
      'notification-function',
      'notify-registration-created',
      'ok',
      'Edge Function joignable.',
      'Les notifications automatiques peuvent être déclenchées après une demande.',
    )
  }

  return result(
    'notification-function',
    'notify-registration-created',
    'warning',
    `Fonction secondaire indisponible ou refusée : ${serializeSupabaseError(error)}`,
    'Ce point ne bloque pas l’inscription. Vérifier le déploiement de la fonction seulement si les admins ne reçoivent pas d’alerte.',
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
