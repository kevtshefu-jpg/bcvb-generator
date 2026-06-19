import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminNotifications } from '../hooks/useAdminNotifications'
import type { AdminNotificationRow } from '../services/adminNotificationService'

type AdminNotificationBellProps = {
  enabled: boolean
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Date inconnue'

  return date.toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export default function AdminNotificationBell({ enabled }: AdminNotificationBellProps) {
  const [open, setOpen] = useState(false)

  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
  } = useAdminNotifications(enabled)

  if (!enabled) return null

  return (
    <div className="admin-notification-bell">
      <button
        type="button"
        className="admin-notification-bell__button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span aria-hidden="true">🔔</span>
        <span>Notifications</span>

        {unreadCount > 0 ? <strong>{unreadCount}</strong> : null}
      </button>

      {open ? (
        <div className="admin-notification-bell__panel">
          <header>
            <div>
              <p>Administration</p>
              <h2>Notifications</h2>
            </div>

            <Link to="/admin/demandes-profils" onClick={() => setOpen(false)}>
              Voir demandes
            </Link>
          </header>

          {loading ? (
            <p className="admin-notification-bell__state">Chargement...</p>
          ) : null}

          {error ? (
            <p className="admin-notification-bell__state is-error">
              {error}
            </p>
          ) : null}

          {!loading && notifications.length === 0 ? (
            <p className="admin-notification-bell__state">
              Aucune notification pour le moment.
            </p>
          ) : null}

          <div className="admin-notification-bell__list">
            {notifications.map((notification: AdminNotificationRow) => (
              <article
                key={notification.id}
                className={
                  notification.read_at
                    ? 'admin-notification-bell__item'
                    : 'admin-notification-bell__item admin-notification-bell__item--unread'
                }
              >
                <div>
                  <h3>{notification.title}</h3>
                  <p>{notification.message}</p>
                  <small>{formatDate(notification.created_at)}</small>
                </div>

                <div className="admin-notification-bell__itemActions">
                  {notification.action_url ? (
                    <Link
                      to={notification.action_url}
                      onClick={() => {
                        markAsRead(notification.id)
                        setOpen(false)
                      }}
                    >
                      Ouvrir
                    </Link>
                  ) : null}

                  {!notification.read_at ? (
                    <button
                      type="button"
                      onClick={() => markAsRead(notification.id)}
                    >
                      Lu
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}