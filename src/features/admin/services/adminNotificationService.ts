import { supabase } from '../../../lib/supabase'

export type AdminNotificationRow = {
  id: string
  type: string
  title: string
  message: string
  action_url: string | null
  metadata: Record<string, unknown>
  recipient_user_id: string | null
  recipient_role: string | null
  read_at: string | null
  created_at: string
}

export async function fetchAdminNotifications() {
  const { data, error } = await supabase
    .from('admin_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as AdminNotificationRow[]
}

export async function markAdminNotificationAsRead(notificationId: string) {
  const { data, error } = await supabase
    .from('admin_notifications')
    .update({
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as AdminNotificationRow
}

export async function markAllAdminNotificationsAsRead() {
  const { error } = await supabase
    .from('admin_notifications')
    .update({
      read_at: new Date().toISOString(),
    })
    .is('read_at', null)

  if (error) {
    throw new Error(error.message)
  }
}