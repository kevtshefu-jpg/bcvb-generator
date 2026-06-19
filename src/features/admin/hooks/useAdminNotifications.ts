import { useCallback, useEffect, useMemo, useState } from 'react'

import { supabase } from '../../../lib/supabase'
import {
  fetchAdminNotifications,
  markAdminNotificationAsRead,
  type AdminNotificationRow,
} from '../services/adminNotificationService'

export function useAdminNotifications(enabled: boolean) {
  const [notifications, setNotifications] = useState<AdminNotificationRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read_at).length,
    [notifications],
  )

  const refresh = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)

      const rows = await fetchAdminNotifications()
      setNotifications(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les notifications.')
    } finally {
      setLoading(false)
    }
  }, [enabled])

  const markAsRead = useCallback(async (notificationId: string) => {
    const updated = await markAdminNotificationAsRead(notificationId)

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId ? updated : notification,
      ),
    )
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!enabled) return

    const channel = supabase
      .channel('admin-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications',
        },
        (payload) => {
          setNotifications((current) => [
            payload.new as AdminNotificationRow,
            ...current,
          ])
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [enabled])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    markAsRead,
  }
}