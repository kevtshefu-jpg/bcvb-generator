import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  approveProfileRequest,
  fetchProfileRequests,
  rejectProfileRequest,
  updateProfileRequestDraft,
  type ProfileRequestRow,
  type ProfileRequestStatus,
} from '../services/profileRequestService'

const ROLE_OPTIONS = [
  { value: 'member', label: 'Membre' },
  { value: 'coach', label: 'Coach' },
  { value: 'joueur', label: 'Joueur' },
  { value: 'parent', label: 'Parent' },
  { value: 'parent_referent', label: 'Parent référent' },
  { value: 'dirigeant', label: 'Dirigeant' },
  { value: 'responsable_technique', label: 'Responsable technique' },
  { value: 'admin', label: 'Admin' },
]

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les demandes.')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  async function handleFieldChange(
    request: ProfileRequestRow,
    patch: Partial<Pick<ProfileRequestRow, 'requested_role' | 'requested_category_id' | 'requested_team' | 'phone' | 'admin_note'>>,
  ) {
    try {
      setError(null)

      const updated = await updateProfileRequestDraft(request.id, patch)

      setRequests((current) =>
        current.map((item) => (item.id === request.id ? updated : item)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Modification impossible.')
    }
  }

  async function handleApprove(request: ProfileRequestRow) {
    try {
      setActionId(request.id)
      setError(null)

      const updated = await approveProfileRequest({
        requestId: request.id,
        finalRole: request.requested_role || 'member',
        finalCategoryId: request.requested_category_id,
        adminNote: request.admin_note,
      })

      setRequests((current) =>
        current.map((item) => (item.id === request.id ? updated : item)),
      )

      setMessage(`Demande validée pour ${request.full_name}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation impossible.')
    } finally {
      setActionId(null)
    }
  }

  async function handleReject(request: ProfileRequestRow) {
    const reason = window.prompt(
      `Pourquoi refuser la demande de ${request.full_name} ?`,
      request.admin_note || '',
    )

    if (!reason?.trim()) {
      setMessage('Refus annulé : un motif est nécessaire.')
      return
    }

    try {
      setActionId(request.id)
      setError(null)

      const updated = await rejectProfileRequest(request.id, reason.trim())

      setRequests((current) =>
        current.map((item) => (item.id === request.id ? updated : item)),
      )

      setMessage(`Demande refusée pour ${request.full_name}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refus impossible.')
    } finally {
      setActionId(null)
    }
  }

  return (
    <section className="admin-profile-requests-page bcvb-page">
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
                <span>Rôle demandé / final</span>
                <select
                  value={request.requested_role}
                  disabled={request.status !== 'pending'}
                  onChange={(event) =>
                    handleFieldChange(request, {
                      requested_role: event.target.value,
                    })
                  }
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
                  value={request.requested_category_id || ''}
                  disabled={request.status !== 'pending'}
                  onChange={(event) =>
                    handleFieldChange(request, {
                      requested_category_id: event.target.value || null,
                    })
                  }
                  placeholder="U15M, SF1, dirigeant, parent..."
                />
              </label>

              <label>
                <span>Téléphone</span>
                <input
                  value={request.phone || ''}
                  disabled={request.status !== 'pending'}
                  onChange={(event) =>
                    handleFieldChange(request, {
                      phone: event.target.value || null,
                    })
                  }
                  placeholder="06..."
                />
              </label>
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
                value={request.admin_note || ''}
                disabled={request.status !== 'pending'}
                onChange={(event) =>
                  handleFieldChange(request, {
                    admin_note: event.target.value || null,
                  })
                }
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
    </section>
  )
}