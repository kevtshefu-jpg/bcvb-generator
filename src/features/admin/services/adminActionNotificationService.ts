import { supabase } from '../../../lib/supabase'

type CreateAdminActionNotificationPayload = {
  eventType: string
  title: string
  message: string
  actionUrl?: string | null
  metadata?: Record<string, unknown>
}

type NotificationPreferenceLookup = {
  enabled?: boolean | null
  notify_admin?: boolean | null
  notify_responsable_technique?: boolean | null
}

async function fetchPreference(eventType: string) {
  const { data, error } = await supabase
    .from('admin_notification_preferences')
    .select('enabled, notify_admin, notify_responsable_technique')
    .eq('event_type', eventType)
    .maybeSingle()

  if (error) {
    console.warn(
      'Préférence notification indisponible, création admin par défaut :',
      error.message,
    )
    return null
  }

  return data as NotificationPreferenceLookup | null
}

async function insertNotification(
  payload: CreateAdminActionNotificationPayload,
  recipientRole: string,
) {
  const basePayload = {
    type: payload.eventType,
    title: payload.title,
    message: payload.message,
    action_url: payload.actionUrl || null,
  }

  const { error } = await supabase
    .from('admin_notifications')
    .insert({
      ...basePayload,
      metadata: payload.metadata || {},
      recipient_role: recipientRole,
    })

  if (!error) return

  const value = error.message.toLowerCase()
  const isMissingColumn =
    value.includes('could not find') ||
    value.includes('schema cache') ||
    (value.includes('column') && value.includes('does not exist'))

  if (!isMissingColumn) {
    throw new Error(error.message)
  }

  const { error: fallbackError } = await supabase
    .from('admin_notifications')
    .insert(basePayload)

  if (fallbackError) throw new Error(fallbackError.message)
}

export async function createAdminActionNotification(
  payload: CreateAdminActionNotificationPayload,
) {
  try {
    const preference = await fetchPreference(payload.eventType)

    if (preference && preference.enabled === false) {
      return { ok: true, skipped: true }
    }

    const shouldNotifyAdmin = preference?.notify_admin ?? true
    const shouldNotifyResponsableTechnique =
      preference?.notify_responsable_technique ?? false

    const insertions: Array<Promise<void>> = []

    if (shouldNotifyAdmin) {
      insertions.push(insertNotification(payload, 'admin'))
    }

    if (shouldNotifyResponsableTechnique) {
      insertions.push(insertNotification(payload, 'responsable_technique'))
    }

    if (!insertions.length) {
      return { ok: true, skipped: true }
    }

    await Promise.all(insertions)
    return { ok: true, skipped: false }
  } catch (error) {
    console.warn('Notification admin non bloquante échouée :', error)
    return { ok: false, skipped: false }
  }
}
