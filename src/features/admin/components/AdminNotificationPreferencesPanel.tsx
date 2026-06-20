import { useEffect, useState } from 'react'

import {
  ensureDefaultAdminNotificationPreferences,
  fetchAdminNotificationPreferences,
  updateAdminNotificationPreference,
  type AdminNotificationPreference,
  type AdminNotificationPreferencePatch,
} from '../services/adminNotificationPreferencesService'
import './AdminNotificationPreferencesPanel.css'

export default function AdminNotificationPreferencesPanel() {
  const [preferences, setPreferences] = useState<AdminNotificationPreference[]>([])
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadPreferences() {
    try {
      setLoading(true)
      setError(null)
      setMessage(null)

      const rows = await ensureDefaultAdminNotificationPreferences()
      setPreferences(rows)
      setMessage('Préférences chargées.')
    } catch (err) {
      console.warn('Chargement préférences notifications impossible :', err)
      setError('Impossible de charger les préférences. Le fallback local reste disponible.')

      const rows = await fetchAdminNotificationPreferences()
      setPreferences(rows)
    } finally {
      setLoading(false)
    }
  }

  async function updatePreference(
    preference: AdminNotificationPreference,
    patch: AdminNotificationPreferencePatch,
  ) {
    const previousPreferences = preferences
    const nextPreferences = preferences.map((item) =>
      item.id === preference.id ? { ...item, ...patch } : item,
    )

    try {
      setSavingId(preference.id)
      setPreferences(nextPreferences)
      setError(null)
      setMessage(null)

      const updated = await updateAdminNotificationPreference(preference.id, patch)

      setPreferences((current) =>
        current.map((item) => (item.id === preference.id ? updated : item)),
      )
      setMessage('Préférence mise à jour.')
    } catch (err) {
      console.warn('Mise à jour préférence notification impossible :', err)
      setPreferences(previousPreferences)
      setError('Impossible de sauvegarder cette préférence pour le moment.')
    } finally {
      setSavingId(null)
    }
  }

  useEffect(() => {
    loadPreferences()
  }, [])

  return (
    <section className="admin-settings-panel admin-notification-preferences">
      <header className="admin-settings-panel__head admin-notification-preferences__header">
        <div>
          <p>Notifications administrateur</p>
          <h2>Événements suivis par le club</h2>
          <span>
            Active ou coupe les notifications générées par les demandes, documents,
            séances, planifications et actions groupées.
          </span>
        </div>

        <button type="button" onClick={loadPreferences} disabled={loading}>
          {loading ? 'Chargement…' : 'Recharger'}
        </button>
      </header>

      {message ? (
        <p className="admin-notification-preferences__message">{message}</p>
      ) : null}

      {error ? (
        <p className="admin-notification-preferences__message admin-notification-preferences__message--error">
          {error}
        </p>
      ) : null}

      <div className="admin-notification-preferences__grid">
        {preferences.map((preference) => {
          const disabled = loading || savingId === preference.id

          return (
            <article className="admin-notification-preference-card" key={preference.event_type}>
              <header>
                <span>{preference.enabled ? 'Active' : 'Coupée'}</span>
                <h3 className="admin-notification-preference-card__title">
                  {preference.label}
                </h3>
                <p className="admin-notification-preference-card__text">
                  {preference.description || 'Notification configurable.'}
                </p>
              </header>

              <div className="admin-notification-preference-card__toggles">
                <label className="admin-notification-preference-card__toggle">
                  <input
                    type="checkbox"
                    checked={preference.enabled}
                    disabled={disabled}
                    onChange={(event) =>
                      updatePreference(preference, { enabled: event.target.checked })
                    }
                  />
                  <span>Activer l’événement</span>
                </label>

                <label className="admin-notification-preference-card__toggle">
                  <input
                    type="checkbox"
                    checked={preference.notify_admin}
                    disabled={disabled || !preference.enabled}
                    onChange={(event) =>
                      updatePreference(preference, { notify_admin: event.target.checked })
                    }
                  />
                  <span>Notifier admin</span>
                </label>

                <label className="admin-notification-preference-card__toggle">
                  <input
                    type="checkbox"
                    checked={preference.notify_responsable_technique}
                    disabled={disabled || !preference.enabled}
                    onChange={(event) =>
                      updatePreference(preference, {
                        notify_responsable_technique: event.target.checked,
                      })
                    }
                  />
                  <span>Notifier responsable technique</span>
                </label>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
