import { useMemo, useState } from 'react'

import { ROLE_LABELS, normalizeRole } from '../../../config/roles'
import { useAuth } from '../../auth/context/AuthContext'
import RegistrationDiagnosticsPanel from '../components/RegistrationDiagnosticsPanel'
import { useRegistrationRequests } from '../hooks/useRegistrationRequests'

import './AdminRegistrationRequestsPage.css'

type RegistrationStatus = 'pending' | 'approved' | 'rejected' | string
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected'
type SortMode = 'pending-first' | 'newest-first' | 'oldest-first'

const APPROVAL_ROLE_OPTIONS = [
  'member',
  'coach',
  'dirigeant',
  'responsable_technique',
  'parent_referent',
  'team_staff',
  'benevole',
  'arbitre',
  'otm',
  'admin',
] as const

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

function getRoleLabel(role: string) {
  const value = normalizeRole(role)
  const label = ROLE_LABELS[value as keyof typeof ROLE_LABELS]

  return label || role || 'Membre'
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

function getRequestTimestamp(item: RegistrationRequestLike) {
  if (!item.created_at) return 0

  const date = new Date(item.created_at)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

function matchesSearch(item: RegistrationRequestLike, searchTerm: string) {
  const query = normalizeText(searchTerm).toLowerCase()

  if (!query) return true

  const searchable = [
    getFullName(item),
    item.email,
    item.phone,
    item.birth_year,
    getRequestedCategory(item),
    getRequestedRole(item),
    item.requested_team,
    item.notes,
    item.status,
  ]
    .map((value) => normalizeText(value).toLowerCase())
    .join(' ')

  return searchable.includes(query)
}

export default function AdminRegistrationRequestsPage() {
  const { user } = useAuth()
  const { requests, loading, error, approve, reject, lastCreatedPassword } =
    useRegistrationRequests(user?.id)

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [roleFilter, setRoleFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('pending-first')
  const [roleOverrides, setRoleOverrides] = useState<Record<string, string>>({})

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

  const availableRoles = useMemo(() => {
    const roles = new Set<string>()

    requests.forEach((item) => {
      const role = getRequestedRole(item)
      if (role) roles.add(role)
    })

    return Array.from(roles).sort((a, b) =>
      getRoleLabel(a).localeCompare(getRoleLabel(b), 'fr'),
    )
  }, [requests])

  const visibleRequests = useMemo(() => {
    return requests
      .filter((item) => {
        if (statusFilter !== 'all' && item.status !== statusFilter) return false
        if (roleFilter !== 'all' && getRequestedRole(item) !== roleFilter) return false

        return matchesSearch(item, searchTerm)
      })
      .sort((a, b) => {
        if (sortMode === 'pending-first') {
          const aPending = a.status === 'pending' ? 0 : 1
          const bPending = b.status === 'pending' ? 0 : 1

          if (aPending !== bPending) return aPending - bPending
        }

        const aTime = getRequestTimestamp(a)
        const bTime = getRequestTimestamp(b)

        if (sortMode === 'oldest-first') return aTime - bTime

        return bTime - aTime
      })
  }, [requests, roleFilter, searchTerm, sortMode, statusFilter])

  const hasActiveFilters =
    statusFilter !== 'all' || roleFilter !== 'all' || normalizeText(searchTerm) !== ''

  function resetFilters() {
    setStatusFilter('all')
    setRoleFilter('all')
    setSearchTerm('')
    setSortMode('pending-first')
  }

  function getFinalRole(item: RegistrationRequestLike) {
    return normalizeRole(roleOverrides[item.id] || getRequestedRole(item))
  }

  async function handleApprove(item: RegistrationRequestLike) {
    const fullName = getFullName(item)
    const finalRole = getFinalRole(item)

    const confirmed = window.confirm(
      `Valider la demande de ${fullName} et créer son compte avec le rôle "${getRoleLabel(finalRole)}" ?`,
    )

    if (!confirmed) return

    try {
      setActionLoadingId(item.id)
      await approve({
        ...item,
        role_requested: finalRole,
        requested_role: finalRole,
      })
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

      <section className="admin-registration-controls" aria-label="Filtres demandes inscription">
        <div className="admin-registration-controls__top">
          <label>
            <span>Recherche</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Nom, email, équipe, note…"
            />
          </label>

          <label>
            <span>Rôle</span>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <option value="all">Tous les rôles</option>
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {getRoleLabel(role)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Tri</span>
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
            >
              <option value="pending-first">En attente d’abord</option>
              <option value="newest-first">Plus récentes</option>
              <option value="oldest-first">Plus anciennes</option>
            </select>
          </label>
        </div>

        <div className="admin-registration-controls__bottom">
          <div className="admin-registration-controls__filters">
            {[
              ['all', 'Toutes', totalCount],
              ['pending', 'En attente', pendingCount],
              ['approved', 'Approuvées', approvedCount],
              ['rejected', 'Refusées', rejectedCount],
            ].map(([value, label, count]) => (
              <button
                type="button"
                className={statusFilter === value ? 'is-active' : ''}
                key={String(value)}
                onClick={() => setStatusFilter(value as StatusFilter)}
              >
                {label}
                <span>{count}</span>
              </button>
            ))}
          </div>

          <div className="admin-registration-controls__result">
            <strong>{visibleRequests.length}</strong>
            <span>affichée{visibleRequests.length > 1 ? 's' : ''}</span>
            {hasActiveFilters ? (
              <button type="button" onClick={resetFilters}>
                Réinitialiser
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {loading ? (
        <article className="admin-registration-page__empty">
          Chargement des demandes d’inscription…
        </article>
      ) : requests.length === 0 ? (
        <article className="admin-registration-page__empty">
          Aucune demande d’inscription pour le moment.
        </article>
      ) : visibleRequests.length === 0 ? (
        <article className="admin-registration-page__empty">
          Aucune demande ne correspond aux filtres actuels.
        </article>
      ) : (
        <div className="admin-registration-page__grid">
          {visibleRequests.map((item) => {
            const fullName = getFullName(item)
            const statusClass = getStatusClass(item.status)
            const statusLabel = getStatusLabel(item.status)
            const isPending = item.status === 'pending'
            const isActionLoading = actionLoadingId === item.id
            const requestedRole = getRequestedRole(item)
            const finalRole = getFinalRole(item)

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

                {isPending ? (
                  <p className="admin-registration-card__nextAction">
                    Action suivante : vérifier la catégorie puis créer le compte{' '}
                    {getRoleLabel(finalRole)}.
                  </p>
                ) : null}

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
                    <dt>Rôle demandé</dt>
                    <dd>{getRoleLabel(requestedRole)}</dd>
                  </div>

                  {isPending ? (
                    <div>
                      <dt>Rôle final</dt>
                      <dd>
                        <select
                          className="admin-registration-card__roleSelect"
                          value={finalRole}
                          disabled={isActionLoading}
                          onChange={(event) =>
                            setRoleOverrides((current) => ({
                              ...current,
                              [item.id]: event.target.value,
                            }))
                          }
                        >
                          {APPROVAL_ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>
                              {getRoleLabel(role)}
                            </option>
                          ))}
                        </select>
                      </dd>
                    </div>
                  ) : null}

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
                  {item.email ? (
                    <a
                      className="admin-registration-card__link"
                      href={`mailto:${item.email}`}
                    >
                      Contacter
                    </a>
                  ) : null}

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
