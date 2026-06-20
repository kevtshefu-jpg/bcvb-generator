import { useMemo, useState } from 'react'

import { useAuth } from '../../auth/context/AuthContext'
import RegistrationDiagnosticsPanel from '../components/RegistrationDiagnosticsPanel'
import { useRegistrationRequests } from '../hooks/useRegistrationRequests'

import './AdminRegistrationRequestsPage.css'

type RegistrationStatus = 'pending' | 'approved' | 'rejected' | string

type RegistrationRequestLike = {
  id: string
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  birth_year?: number | string | null
  category_requested?: string | null
  requested_category?: string | null
  role_requested?: string | null
  requested_role?: string | null
  requested_team?: string | null
  notes?: string | null
  status?: RegistrationStatus | null
  created_at?: string | null
}

function normalizeText(value: unknown) {
  return String(value || '').trim()
}

function getFullName(item: RegistrationRequestLike) {
  const firstName = normalizeText(item.first_name)
  const lastName = normalizeText(item.last_name)
  const fullName = `${firstName} ${lastName}`.trim()

  return fullName || normalizeText(item.email) || 'Demande sans nom'
}

function getStatusLabel(status?: RegistrationStatus | null) {
  if (status === 'approved') return 'Approuvée'
  if (status === 'rejected') return 'Refusée'
  if (status === 'pending') return 'En attente'

  return status || 'À traiter'
}

function getStatusClass(status?: RegistrationStatus | null) {
  if (status === 'approved') return 'is-approved'
  if (status === 'rejected') return 'is-rejected'
  if (status === 'pending') return 'is-pending'

  return 'is-neutral'
}

function getRequestedCategory(item: RegistrationRequestLike) {
  return normalizeText(item.category_requested || item.requested_category || '—')
}

function getRequestedRole(item: RegistrationRequestLike) {
  return normalizeText(item.role_requested || item.requested_role || 'member')
}

function formatDate(value?: string | null) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getReadableError(error?: string | null) {
  if (!error) return null

  if (error.includes('Edge Function returned a non-2xx status code')) {
    return "La création du compte a échoué côté Supabase Edge Function. Vérifie les logs de la fonction create-approved-user dans Supabase."
  }

  return error
}

export default function AdminRegistrationRequestsPage() {
  const { user } = useAuth()
  const { requests, loading, error, approve, reject, lastCreatedPassword } =
    useRegistrationRequests(user?.id)

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const readableError = getReadableError(error)

  const totalCount = requests.length

  const pendingCount = useMemo(
    () => requests.filter((item) => item.status === 'pending').length,
    [requests],
  )

  const approvedCount = useMemo(
    () => requests.filter((item) => item.status === 'approved').length,
    [requests],
  )

  const rejectedCount = useMemo(
    () => requests.filter((item) => item.status === 'rejected').length,
    [requests],
  )

  async function handleApprove(item: RegistrationRequestLike) {
    const fullName = getFullName(item)
    const requestedRole = getRequestedRole(item)

    const confirmed = window.confirm(
      `Valider la demande de ${fullName} et créer son compte avec le rôle "${requestedRole}" ?`,
    )

    if (!confirmed) return

    try {
      setActionLoadingId(item.id)
      await approve(item)
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleReject(item: RegistrationRequestLike) {
    const fullName = getFullName(item)

    const confirmed = window.confirm(`Refuser la demande de ${fullName} ?`)

    if (!confirmed) return

    try {
      setActionLoadingId(item.id)
      await reject(item)
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <section className="admin-registration-page">
      <header className="admin-registration-page__hero">
        <div className="admin-registration-page__heroContent">
          <p className="admin-registration-page__eyebrow">Administration</p>
          <h1 className="admin-registration-page__title">
            Demandes d’inscription
          </h1>
          <p className="admin-registration-page__text">
            Valide les demandes publiques pour créer un vrai compte utilisateur
            et rattacher son profil club.
          </p>
        </div>

        <div className="admin-registration-page__heroBadge">
          <span>Demandes</span>
          <strong>{totalCount}</strong>
        </div>
      </header>

      <div className="admin-registration-page__stats">
        <article>
          <strong>{totalCount}</strong>
          <span>Total</span>
        </article>

        <article>
          <strong>{pendingCount}</strong>
          <span>En attente</span>
        </article>

        <article>
          <strong>{approvedCount}</strong>
          <span>Approuvées</span>
        </article>

        <article>
          <strong>{rejectedCount}</strong>
          <span>Refusées</span>
        </article>
      </div>

      {readableError ? (
        <article className="admin-registration-message admin-registration-message--error">
          <strong>Erreur de traitement</strong>
          <p>{readableError}</p>
        </article>
      ) : null}

      {lastCreatedPassword ? (
        <article className="admin-registration-message admin-registration-message--success">
          <strong>Compte créé</strong>
          <p>
            Mot de passe temporaire :{' '}
            <code>{lastCreatedPassword}</code>
          </p>
          <p>
            Transmets-le uniquement par un canal sécurisé au nouvel utilisateur.
          </p>
        </article>
      ) : null}

      <RegistrationDiagnosticsPanel />

      {loading ? (
        <article className="admin-registration-page__empty">
          Chargement des demandes d’inscription…
        </article>
      ) : requests.length === 0 ? (
        <article className="admin-registration-page__empty">
          Aucune demande d’inscription pour le moment.
        </article>
      ) : (
        <div className="admin-registration-page__grid">
          {requests.map((item) => {
            const fullName = getFullName(item)
            const statusClass = getStatusClass(item.status)
            const statusLabel = getStatusLabel(item.status)
            const isPending = item.status === 'pending'
            const isActionLoading = actionLoadingId === item.id

            return (
              <article className="admin-registration-card" key={item.id}>
                <div className="admin-registration-card__top">
                  <span
                    className={`admin-registration-card__status ${statusClass}`}
                  >
                    {statusLabel}
                  </span>

                  <small>{formatDate(item.created_at)}</small>
                </div>

                <h2>{fullName}</h2>

                <dl className="admin-registration-card__details">
                  <div>
                    <dt>Email</dt>
                    <dd>{item.email || '—'}</dd>
                  </div>

                  <div>
                    <dt>Téléphone</dt>
                    <dd>{item.phone || '—'}</dd>
                  </div>

                  <div>
                    <dt>Année</dt>
                    <dd>{item.birth_year || '—'}</dd>
                  </div>

                  <div>
                    <dt>Catégorie demandée</dt>
                    <dd>{getRequestedCategory(item)}</dd>
                  </div>

                  <div>
                    <dt>Type</dt>
                    <dd>{getRequestedRole(item)}</dd>
                  </div>

                  <div>
                    <dt>Équipe / groupe</dt>
                    <dd>{item.requested_team || '—'}</dd>
                  </div>

                  <div className="admin-registration-card__full">
                    <dt>Notes</dt>
                    <dd>{item.notes || '—'}</dd>
                  </div>
                </dl>

                <div className="admin-registration-card__actions">
                  {isPending ? (
                    <>
                      <button
                        type="button"
                        className="admin-registration-card__button admin-registration-card__button--primary"
                        disabled={isActionLoading}
                        onClick={() => handleApprove(item)}
                      >
                        {isActionLoading
                          ? 'Création du compte…'
                          : 'Approuver et créer le compte'}
                      </button>

                      <button
                        type="button"
                        className="admin-registration-card__button admin-registration-card__button--danger"
                        disabled={isActionLoading}
                        onClick={() => handleReject(item)}
                      >
                        Refuser
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="admin-registration-card__button"
                      disabled
                    >
                      Demande déjà traitée
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
