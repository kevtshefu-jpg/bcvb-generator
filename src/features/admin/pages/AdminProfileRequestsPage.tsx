import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  approveProfileRequest,
  fetchProfileRequests,
  rejectProfileRequest,
  type ProfileRequestRow,
  type ProfileRequestStatus,
} from '../services/profileRequestService'
import { PageShell } from '../../../components/ui/PageShell'
import { ADMIN_ASSIGNABLE_ROLES, ROLE_LABELS } from '../../../config/roles'
import { formatUserFacingError } from '../../../lib/userFacingError'

import './AdminProfileRequestsPage.css'

const ROLE_OPTIONS = ADMIN_ASSIGNABLE_ROLES.map((value) => ({
  value,
  label: ROLE_LABELS[value],
}))

const STATUS_OPTIONS: Array<{ value: ProfileRequestStatus | 'all'; label: string }> = [
  { value: 'pending', label: 'En attente' },
  { value: 'approved', label: 'Validées' },
  { value: 'rejected', label: 'Refusées' },
  { value: 'needs_info', label: 'Infos à compléter' },
  { value: 'all', label: 'Toutes' },
]

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Date inconnue'

  return date.toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export default function AdminProfileRequestsPage() {
  const [requests, setRequests] = useState<ProfileRequestRow[]>([])
  const [status, setStatus] = useState<ProfileRequestStatus | 'all'>('pending')
  const [loading, setLoading] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, { finalRole: string; categoryId: string; adminNote: string }>>({})

  const pendingCount = useMemo(
    () => requests.filter((request) => request.status === 'pending').length,
    [requests],
  )

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const rows = await fetchProfileRequests(status)
      setRequests(rows)
      setDrafts(Object.fromEntries(rows.map((request) => [request.id, {
        finalRole: request.requested_role || 'member',
        categoryId: request.requested_category_id || '',
        adminNote: request.admin_note || '',
      }])))
    } catch (err) {
      setError(formatUserFacingError(err, 'Impossible de charger les demandes pour le moment.'))
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  function updateDraft(request: ProfileRequestRow, patch: Partial<{ finalRole: string; categoryId: string; adminNote: string }>) {
    setDrafts((current) => ({
      ...current,
      [request.id]: {
        ...current[request.id],
        finalRole: request.requested_role || 'member',
        categoryId: request.requested_category_id || '',
        adminNote: request.admin_note || '',
        ...patch,
      },
    }))
  }

  async function handleApprove(request: ProfileRequestRow) {
    const draft = drafts[request.id]
    if (!window.confirm(`Valider le profil de ${request.full_name} avec le rôle « ${ROLE_LABELS[(draft?.finalRole || 'member') as keyof typeof ROLE_LABELS] || draft?.finalRole} » ?`)) return

    try {
      setActionId(request.id)
      setError(null)

      const updated = await approveProfileRequest({
        requestId: request.id,
        finalRole: draft?.finalRole || request.requested_role || 'member',
        finalCategoryId: draft?.categoryId || null,
        adminNote: draft?.adminNote || null,
      })

      setRequests((current) =>
        current.map((item) => (item.id === request.id ? updated : item)),
      )

      setMessage(`Demande validée pour ${request.full_name}.`)
    } catch (err) {
      setError(formatUserFacingError(err, 'La demande n’a pas pu être validée. Recharge la liste puis réessaie.'))
    } finally {
      setActionId(null)
    }
  }

  async function handleReject(request: ProfileRequestRow) {
    const note = drafts[request.id]?.adminNote?.trim() || null
    if (!window.confirm(`Refuser la demande de ${request.full_name} ?${note ? ' La note administrateur sera enregistrée.' : ''}`)) return

    try {
      setActionId(request.id)
      setError(null)

      const updated = await rejectProfileRequest(request.id, note)

      setRequests((current) =>
        current.map((item) => (item.id === request.id ? updated : item)),
      )

      setMessage(`Demande refusée pour ${request.full_name}.`)
    } catch (err) {
      setError(formatUserFacingError(err, 'La demande n’a pas pu être refusée. Recharge la liste puis réessaie.'))
    } finally {
      setActionId(null)
    }
  }

  return (
    <section className="admin-profile-requests-page bcvb-page">
      <PageShell variant="wide">
      <div className="admin-profile-requests-hero">
        <div>
          <p className="bcvb-eyebrow">Administration</p>
          <h1>Demandes de profils</h1>
          <p>
            Valider, modifier ou refuser les personnes qui souhaitent devenir membres de la plateforme BCVB.
          </p>
        </div>

        <div className="admin-profile-requests-hero__badge">
          <span>En attente</span>
          <strong>{pendingCount}</strong>
        </div>
      </div>

      <div className="admin-profile-requests-toolbar">
        <label>
          <span>Statut</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as ProfileRequestStatus | 'all')}
          >
            {STATUS_OPTIONS.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button type="button" onClick={loadRequests}>
          Recharger
        </button>
      </div>

      {loading ? <p className="admin-profile-requests-state">Chargement...</p> : null}
      {message ? <p className="admin-profile-requests-message">{message}</p> : null}
      {error ? <p className="admin-profile-requests-error">{error}</p> : null}

      <div className="admin-profile-requests-list">
        {!loading && requests.length === 0 ? (
          <article className="admin-profile-request-card">
            <h2>Aucune demande</h2>
            <p>Aucune demande ne correspond au filtre sélectionné.</p>
          </article>
        ) : null}

        {requests.map((request) => (
          <article className="admin-profile-request-card" key={request.id}>
            <header>
              <div>
                <p className="bcvb-eyebrow">{request.status}</p>
                <h2>{request.full_name}</h2>
                <p>{request.email}</p>
              </div>

              <span>{formatDate(request.created_at)}</span>
            </header>

            <div className="admin-profile-request-grid">
              <label>
                <span>Rôle demandé</span>
                <strong className="admin-profile-request-value">
                  {ROLE_LABELS[request.requested_role as keyof typeof ROLE_LABELS] || request.requested_role}
                </strong>
              </label>

              <label>
                <span>Rôle final</span>
                <select
                  value={drafts[request.id]?.finalRole || request.requested_role}
                  disabled={request.status !== 'pending'}
                  onChange={(event) => updateDraft(request, { finalRole: event.target.value })}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option value={role.value} key={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Catégorie / équipe</span>
                <input
                  value={drafts[request.id]?.categoryId ?? request.requested_category_id ?? ''}
                  disabled={request.status !== 'pending'}
                  onChange={(event) => updateDraft(request, { categoryId: event.target.value })}
                  placeholder="U15M, SF1, dirigeant, parent..."
                />
              </label>

              <div><span>Téléphone</span><strong className="admin-profile-request-value">{request.phone || '—'}</strong></div>
            </div>

            {request.motivation || request.message ? (
              <div className="admin-profile-request-note">
                <strong>Message du demandeur</strong>
                <p>{request.motivation || request.message}</p>
              </div>
            ) : null}

            <label className="admin-profile-request-admin-note">
              <span>Note admin</span>
              <textarea
                value={drafts[request.id]?.adminNote ?? request.admin_note ?? ''}
                disabled={request.status !== 'pending'}
                onChange={(event) => updateDraft(request, { adminNote: event.target.value })}
                placeholder="Décision, précision, catégorie, remarque interne..."
              />
            </label>

            <footer>
              {request.status === 'pending' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleApprove(request)}
                    disabled={actionId === request.id}
                  >
                    {actionId === request.id ? 'Validation...' : 'Valider le profil'}
                  </button>

                  <button
                    type="button"
                    className="is-danger"
                    onClick={() => handleReject(request)}
                    disabled={actionId === request.id}
                  >
                    Refuser
                  </button>
                </>
              ) : (
                <span>
                  Décision : {request.status}
                  {request.decided_at ? ` · ${formatDate(request.decided_at)}` : ''}
                </span>
              )}
            </footer>
          </article>
        ))}
      </div>
      </PageShell>
    </section>
  )
}
