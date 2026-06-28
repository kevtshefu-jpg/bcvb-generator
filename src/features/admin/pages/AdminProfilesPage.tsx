import { useCallback, useEffect, useMemo, useState } from 'react'

import { ROLE_LABELS, normalizeRole } from '../../../config/roles'
import { useAuth } from '../../auth/context/AuthContext'
import {
  fetchAdminProfiles,
  runAdminProfileAction,
  type AdminProfileAction,
  type AdminProfileRow,
} from '../services/adminProfileManagementService'

import './AdminProfilesPage.css'

type StatusFilter = 'all' | 'active' | 'inactive'
type PendingAction = {
  profile: AdminProfileRow
  action: AdminProfileAction
} | null

const ROLE_ORDER = [
  'admin',
  'responsable_technique',
  'dirigeant',
  'coach',
  'team_staff',
  'parent_referent',
  'parent',
  'joueur',
  'benevole',
  'arbitre',
  'otm',
  'member',
]

function normalizeText(value: unknown) {
  return String(value || '').trim()
}

function isActive(profile: AdminProfileRow) {
  return profile.is_active !== false
}

function isElevatedRole(role?: string | null) {
  return ['admin', 'responsable_technique'].includes(normalizeRole(role))
}

function getDisplayName(profile: AdminProfileRow) {
  return normalizeText(profile.full_name) || normalizeText(profile.email) || 'Profil sans nom'
}

function getRoleLabel(role?: string | null) {
  const normalized = normalizeRole(role)
  return ROLE_LABELS[normalized as keyof typeof ROLE_LABELS] || normalized
}

function formatDate(value?: string | null) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function getActionLabel(action: AdminProfileAction) {
  if (action === 'deactivate') return 'Désactiver'
  if (action === 'reactivate') return 'Réactiver'
  return 'Supprimer définitivement'
}

function getSuccessMessage(action: AdminProfileAction) {
  if (action === 'deactivate') return 'Profil désactivé.'
  if (action === 'reactivate') return 'Profil réactivé.'
  return 'Profil supprimé.'
}

export default function AdminProfilesPage() {
  const { profile: currentProfile } = useAuth()
  const [profiles, setProfiles] = useState<AdminProfileRow[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  )

  const activeElevatedCount = useMemo(
    () =>
      profiles.filter(
        (item) => isActive(item) && isElevatedRole(item.role),
      ).length,
    [profiles],
  )

  const availableRoles = useMemo(() => {
    const roles = new Set(profiles.map((item) => normalizeRole(item.role)))
    return Array.from(roles).sort((a, b) => {
      const aIndex = ROLE_ORDER.indexOf(a)
      const bIndex = ROLE_ORDER.indexOf(b)
      const safeA = aIndex === -1 ? ROLE_ORDER.length : aIndex
      const safeB = bIndex === -1 ? ROLE_ORDER.length : bIndex

      return safeA - safeB || getRoleLabel(a).localeCompare(getRoleLabel(b), 'fr')
    })
  }, [profiles])

  const filteredProfiles = useMemo(() => {
    const query = normalizeText(searchTerm).toLowerCase()

    return profiles.filter((item) => {
      const normalizedRole = normalizeRole(item.role)
      const active = isActive(item)

      if (roleFilter !== 'all' && normalizedRole !== roleFilter) return false
      if (statusFilter === 'active' && !active) return false
      if (statusFilter === 'inactive' && active) return false

      if (!query) return true

      const searchable = [item.full_name, item.email, normalizedRole, getRoleLabel(normalizedRole)]
        .map((value) => normalizeText(value).toLowerCase())
        .join(' ')

      return searchable.includes(query)
    })
  }, [profiles, roleFilter, searchTerm, statusFilter])

  const activeCount = useMemo(
    () => profiles.filter((item) => isActive(item)).length,
    [profiles],
  )

  const inactiveCount = profiles.length - activeCount

  const loadProfiles = useCallback(async (options?: { keepToast?: boolean }) => {
    try {
      setLoading(true)
      if (!options?.keepToast) setToast(null)
      const rows = await fetchAdminProfiles()
      setProfiles(rows)
    } catch (error) {
      setToast({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Impossible de charger les profils.',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  function isSelf(profile: AdminProfileRow) {
    return profile.id === currentProfile?.id
  }

  function wouldRemoveLastActiveAdmin(profile: AdminProfileRow) {
    return isActive(profile) && isElevatedRole(profile.role) && activeElevatedCount <= 1
  }

  function openAction(profile: AdminProfileRow, action: AdminProfileAction) {
    setDeleteConfirmation('')
    setPendingAction({ profile, action })
  }

  async function confirmAction() {
    if (!pendingAction) return

    const { profile, action } = pendingAction

    if (action === 'delete' && deleteConfirmation !== 'SUPPRIMER') {
      setToast({
        type: 'error',
        message: 'Tape SUPPRIMER pour confirmer la suppression définitive.',
      })
      return
    }

    try {
      setActionLoadingId(profile.id)
      setToast(null)
      await runAdminProfileAction(profile.id, action)
      setPendingAction(null)
      setDeleteConfirmation('')
      setToast({ type: 'success', message: getSuccessMessage(action) })
      await loadProfiles({ keepToast: true })
    } catch (error) {
      setToast({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Erreur de permission ou action impossible.',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <section className="admin-profiles-page bcvb-page">
      <header className="admin-profiles-hero">
        <div>
          <p className="bcvb-eyebrow">Administration</p>
          <h1>Gestion des membres</h1>
          <p>
            Rechercher, filtrer, désactiver ou supprimer les profils utilisateurs
            avec les garde-fous sensibles côté serveur.
          </p>
        </div>

        <div className="admin-profiles-hero__stats">
          <article>
            <span>Total</span>
            <strong>{profiles.length}</strong>
          </article>
          <article>
            <span>Actifs</span>
            <strong>{activeCount}</strong>
          </article>
          <article>
            <span>Inactifs</span>
            <strong>{inactiveCount}</strong>
          </article>
        </div>
      </header>

      <section className="admin-profiles-toolbar" aria-label="Filtres profils">
        <label>
          <span>Recherche</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Nom ou email"
          />
        </label>

        <label>
          <span>Rôle</span>
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="all">Tous les rôles</option>
            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {getRoleLabel(role)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Statut</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          >
            <option value="all">Tous</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </label>

        <button type="button" onClick={() => loadProfiles()} disabled={loading}>
          Recharger
        </button>
      </section>

      {toast ? (
        <p className={`admin-profiles-toast admin-profiles-toast--${toast.type}`}>
          {toast.message}
        </p>
      ) : null}

      <div className="admin-profiles-tableWrap">
        <table className="admin-profiles-table">
          <thead>
            <tr>
              <th>Profil</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Création</th>
              <th>Mise à jour</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>Chargement des profils...</td>
              </tr>
            ) : null}

            {!loading && filteredProfiles.length === 0 ? (
              <tr>
                <td colSpan={6}>Aucun profil ne correspond aux filtres.</td>
              </tr>
            ) : null}

            {!loading
              ? filteredProfiles.map((item) => {
                  const active = isActive(item)
                  const self = isSelf(item)
                  const lastActiveAdmin = wouldRemoveLastActiveAdmin(item)
                  const actionDisabled = actionLoadingId === item.id

                  return (
                    <tr key={item.id}>
                      <td>
                        <strong>{getDisplayName(item)}</strong>
                        <span>{item.email || 'Email absent'}</span>
                        {self ? <em>Vous</em> : null}
                      </td>
                      <td>{getRoleLabel(item.role)}</td>
                      <td>
                        <span
                          className={`admin-profiles-status ${
                            active ? 'is-active' : 'is-inactive'
                          }`}
                        >
                          {active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td>{formatDate(item.created_at)}</td>
                      <td>{formatDate(item.updated_at)}</td>
                      <td>
                        <div className="admin-profiles-actions">
                          {active ? (
                            <button
                              type="button"
                              onClick={() => openAction(item, 'deactivate')}
                              disabled={self || lastActiveAdmin || actionDisabled}
                              title={
                                self
                                  ? 'Impossible de désactiver votre propre profil'
                                  : lastActiveAdmin
                                    ? 'Impossible de désactiver le dernier admin actif'
                                    : undefined
                              }
                            >
                              Désactiver
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openAction(item, 'reactivate')}
                              disabled={actionDisabled}
                            >
                              Réactiver
                            </button>
                          )}

                          <button
                            type="button"
                            className="is-danger"
                            onClick={() => openAction(item, 'delete')}
                            disabled={self || lastActiveAdmin || actionDisabled}
                            title={
                              self
                                ? 'Impossible de supprimer votre propre profil'
                                : lastActiveAdmin
                                  ? 'Impossible de supprimer le dernier admin actif'
                                  : undefined
                            }
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              : null}
          </tbody>
        </table>
      </div>

      {pendingAction ? (
        <div className="admin-profiles-modalBackdrop" role="presentation">
          <section
            className={`admin-profiles-modal ${
              pendingAction.action === 'delete' ? 'is-danger' : ''
            }`}
            role="dialog"
            aria-modal="true"
            aria-label={`${getActionLabel(pendingAction.action)} le profil`}
          >
            <p className="bcvb-eyebrow">
              {pendingAction.action === 'delete' ? 'Zone danger' : 'Confirmation'}
            </p>
            <h2>{getActionLabel(pendingAction.action)}</h2>
            <p>
              Profil concerné : <strong>{getDisplayName(pendingAction.profile)}</strong>
            </p>

            {pendingAction.action === 'delete' ? (
              <>
                <p>Cette action est irréversible.</p>
                <label>
                  <span>Tape SUPPRIMER pour confirmer</span>
                  <input
                    value={deleteConfirmation}
                    onChange={(event) => setDeleteConfirmation(event.target.value)}
                    placeholder="SUPPRIMER"
                  />
                </label>
              </>
            ) : (
              <p>
                Cette action changera immédiatement le statut du profil. Elle peut être
                annulée en réactivant le compte plus tard.
              </p>
            )}

            <footer>
              <button type="button" onClick={() => setPendingAction(null)}>
                Annuler
              </button>
              <button
                type="button"
                className={pendingAction.action === 'delete' ? 'is-danger' : ''}
                onClick={confirmAction}
                disabled={
                  actionLoadingId === pendingAction.profile.id ||
                  (pendingAction.action === 'delete' && deleteConfirmation !== 'SUPPRIMER')
                }
              >
                {actionLoadingId === pendingAction.profile.id
                  ? 'Traitement...'
                  : getActionLabel(pendingAction.action)}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </section>
  )
}
