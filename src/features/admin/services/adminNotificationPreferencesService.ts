import { supabase } from '../../../lib/supabase'

export type AdminNotificationPreference = {
  id: string
  event_type: string
  label: string
  description: string | null
  enabled: boolean
  notify_admin: boolean
  notify_responsable_technique: boolean
  created_at: string
  updated_at: string
}

export type AdminNotificationPreferencePatch = Partial<
  Pick<
    AdminNotificationPreference,
    'enabled' | 'notify_admin' | 'notify_responsable_technique'
  >
>

const LOCAL_STORAGE_KEY = 'bcvb-admin-notification-preferences'

export const DEFAULT_ADMIN_NOTIFICATION_PREFERENCES: AdminNotificationPreference[] = [
  {
    id: 'registration_created',
    event_type: 'registration_created',
    label: 'Nouvelle demande d’inscription',
    description: 'Un visiteur envoie une demande via le formulaire public.',
    enabled: true,
    notify_admin: true,
    notify_responsable_technique: false,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'registration_approved',
    event_type: 'registration_approved',
    label: 'Inscription validée',
    description: 'Une demande d’inscription est validée par un admin.',
    enabled: true,
    notify_admin: true,
    notify_responsable_technique: false,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'registration_rejected',
    event_type: 'registration_rejected',
    label: 'Inscription refusée',
    description: 'Une demande d’inscription est refusée par un admin.',
    enabled: true,
    notify_admin: true,
    notify_responsable_technique: false,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'profile_request_created',
    event_type: 'profile_request_created',
    label: 'Nouvelle demande de profil',
    description: 'Un profil demande un accès ou une évolution de rôle.',
    enabled: true,
    notify_admin: true,
    notify_responsable_technique: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'authorization_requested',
    event_type: 'authorization_requested',
    label: 'Autorisation demandée',
    description: 'Un utilisateur demande une autorisation sensible.',
    enabled: true,
    notify_admin: true,
    notify_responsable_technique: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'document_created',
    event_type: 'document_created',
    label: 'Document créé',
    description: 'Un document club est ajouté au référentiel.',
    enabled: true,
    notify_admin: true,
    notify_responsable_technique: false,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'document_updated',
    event_type: 'document_updated',
    label: 'Document modifié',
    description: 'Un document existant est corrigé ou enrichi.',
    enabled: true,
    notify_admin: true,
    notify_responsable_technique: false,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'document_deleted',
    event_type: 'document_deleted',
    label: 'Document supprimé',
    description: 'Un document est supprimé ou retiré du référentiel actif.',
    enabled: true,
    notify_admin: true,
    notify_responsable_technique: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'document_archived',
    event_type: 'document_archived',
    label: 'Document archivé',
    description: 'Un document est archivé ou retiré du référentiel courant.',
    enabled: true,
    notify_admin: true,
    notify_responsable_technique: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'import_failed',
    event_type: 'import_failed',
    label: 'Import échoué',
    description: 'Un import de données ou de documents échoue.',
    enabled: true,
    notify_admin: true,
    notify_responsable_technique: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'document_exported',
    event_type: 'document_exported',
    label: 'Document exporté',
    description: 'Un PDF ou une source est généré depuis la plateforme.',
    enabled: true,
    notify_admin: false,
    notify_responsable_technique: false,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'session_created',
    event_type: 'session_created',
    label: 'Séance créée',
    description: 'Un coach ou admin crée une séance terrain.',
    enabled: true,
    notify_admin: false,
    notify_responsable_technique: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'planning_created',
    event_type: 'planning_created',
    label: 'Planification créée',
    description: 'Une planification sportive est créée ou initialisée.',
    enabled: true,
    notify_admin: false,
    notify_responsable_technique: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'bulk_action_completed',
    event_type: 'bulk_action_completed',
    label: 'Action groupée effectuée',
    description: 'Une action groupée est exécutée sur des documents ou données club.',
    enabled: true,
    notify_admin: true,
    notify_responsable_technique: false,
    created_at: '',
    updated_at: '',
  },
]

function nowIso() {
  return new Date().toISOString()
}

function withTimestamps(preferences: AdminNotificationPreference[]) {
  const now = nowIso()

  return preferences.map((preference) => ({
    ...preference,
    created_at: preference.created_at || now,
    updated_at: preference.updated_at || now,
  }))
}

function readLocalPreferences() {
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return withTimestamps(DEFAULT_ADMIN_NOTIFICATION_PREFERENCES)

    const saved = JSON.parse(raw) as AdminNotificationPreference[]
    const savedByEvent = new Map(saved.map((item) => [item.event_type, item]))

    return withTimestamps(
      DEFAULT_ADMIN_NOTIFICATION_PREFERENCES.map((item) => ({
        ...item,
        ...savedByEvent.get(item.event_type),
      })),
    )
  } catch {
    return withTimestamps(DEFAULT_ADMIN_NOTIFICATION_PREFERENCES)
  }
}

function saveLocalPreferences(preferences: AdminNotificationPreference[]) {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(preferences))
  } catch {
    // Local persistence is a convenience fallback only.
  }
}

function isRelationMissingError(message: string) {
  const value = message.toLowerCase()

  return (
    value.includes('relation') && value.includes('does not exist') ||
    value.includes('table') && value.includes('does not exist') ||
    value.includes('could not find the table') ||
    value.includes('pgrst205')
  )
}

function normalizePreference(row: Partial<AdminNotificationPreference>): AdminNotificationPreference {
  const fallback =
    DEFAULT_ADMIN_NOTIFICATION_PREFERENCES.find((item) => item.event_type === row.event_type) ??
    DEFAULT_ADMIN_NOTIFICATION_PREFERENCES[0]

  return {
    ...fallback,
    ...row,
    id: String(row.id || row.event_type || fallback.id),
    event_type: String(row.event_type || fallback.event_type),
    label: String(row.label || fallback.label),
    description: row.description ?? fallback.description,
    enabled: row.enabled ?? fallback.enabled,
    notify_admin: row.notify_admin ?? fallback.notify_admin,
    notify_responsable_technique:
      row.notify_responsable_technique ?? fallback.notify_responsable_technique,
    created_at: row.created_at || nowIso(),
    updated_at: row.updated_at || nowIso(),
  }
}

function getPreferencesPayload() {
  const now = nowIso()

  return DEFAULT_ADMIN_NOTIFICATION_PREFERENCES.map((preference) => ({
    event_type: preference.event_type,
    label: preference.label,
    description: preference.description,
    enabled: preference.enabled,
    notify_admin: preference.notify_admin,
    notify_responsable_technique: preference.notify_responsable_technique,
    updated_at: now,
  }))
}

export async function fetchAdminNotificationPreferences() {
  const { data, error } = await supabase
    .from('admin_notification_preferences')
    .select('*')
    .order('event_type', { ascending: true })

  if (error) {
    console.warn('Préférences notifications admin indisponibles, fallback local :', error.message)
    if (isRelationMissingError(error.message)) {
      throw new Error('Table de préférences absente. Exécute le SQL d’installation.')
    }
    return readLocalPreferences()
  }

  if (!data?.length) {
    return ensureDefaultAdminNotificationPreferences()
  }

  const rowsByEvent = new Map(
    data.map((row) => {
      const normalized = normalizePreference(row as Partial<AdminNotificationPreference>)
      return [normalized.event_type, normalized]
    }),
  )

  return withTimestamps(
    DEFAULT_ADMIN_NOTIFICATION_PREFERENCES.map((item) => ({
      ...item,
      ...rowsByEvent.get(item.event_type),
    })),
  )
}

export async function ensureDefaultAdminNotificationPreferences() {
  const payload = getPreferencesPayload()

  const { data, error } = await supabase
    .from('admin_notification_preferences')
    .upsert(payload, { onConflict: 'event_type' })
    .select('*')
    .order('event_type', { ascending: true })

  if (error) {
    console.warn('Initialisation préférences notifications admin impossible :', error.message)
    if (isRelationMissingError(error.message)) {
      throw new Error('Table de préférences absente. Exécute le SQL d’installation.')
    }
    const local = readLocalPreferences()
    saveLocalPreferences(local)
    return local
  }

  return (data || []).map((row) =>
    normalizePreference(row as Partial<AdminNotificationPreference>),
  )
}

export async function updateAdminNotificationPreference(
  id: string,
  patch: AdminNotificationPreferencePatch,
) {
  const updatedAt = nowIso()

  const { data, error } = await supabase
    .from('admin_notification_preferences')
    .update({
      ...patch,
      updated_at: updatedAt,
    })
    .eq('id', id)
    .select('*')
    .single()

  if (!error && data) {
    return normalizePreference(data as Partial<AdminNotificationPreference>)
  }

  console.warn('Mise à jour préférence notification admin en fallback local :', error?.message)

  const localPreferences = readLocalPreferences()
  const nextPreferences = localPreferences.map((preference) =>
    preference.id === id || preference.event_type === id
      ? { ...preference, ...patch, updated_at: updatedAt }
      : preference,
  )
  saveLocalPreferences(nextPreferences)

  const updated = nextPreferences.find(
    (preference) => preference.id === id || preference.event_type === id,
  )

  if (!updated) {
    throw new Error('Préférence de notification introuvable.')
  }

  return updated
}
