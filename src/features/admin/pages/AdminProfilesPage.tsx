import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  ADMIN_ASSIGNABLE_ROLES,
  ROLE_LABELS,
  isAdminAssignableRole,
  isSensitiveAdminRole,
  normalizeRole,
  type AdminAssignableRole,
} from '../../../config/roles'
import {
  MobileDetailCard,
  ResponsiveDataList,
  StatusBadge,
} from '../../../components/ui/ResponsiveDataView'
import { PageHeader } from '../../../components/ui/PageHeader'
import { EmptyState as CommonEmptyState, ErrorState, LoadingState, PageShell, RetryAction, StatCard, SuccessFeedback } from '../../../components/ui/PageShell'
import { useAuth } from '../../auth/context/AuthContext'
import {
  deactivateProfile,
  deleteProfile,
  listProfiles,
  reactivateProfile,
  updateProfileRole,
  type AdminProfileAction,
  type AdminProfileRow,
} from '../services/adminProfileManagementService'

import './AdminProfilesPage.css'

type StatusFilter = 'all' | 'active' | 'inactive'
type ProfileStatusFilter = 'all' | string
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

function normalizeSearchValue(value: unknown) {
  return normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .replace(/\s+/g, ' ')
}

function isActive(profile: AdminProfileRow) {
  return profile.is_active !== false
}

function isAdminProfileRole(role?: string | null) {
  return normalizeRole(role) === 'admin'
}

function getDisplayName(profile: AdminProfileRow) {
  return normalizeText(profile.full_name) || normalizeText(profile.email) || 'Profil sans nom'
}

function getRoleLabel(role?: string | null) {
  const normalized = normalizeRole(role)
  return ROLE_LABELS[normalized as keyof typeof ROLE_LABELS] || normalized
}

function normalizeProfileStatus(status?: string | null) {
  return normalizeSearchValue(status).replace(/\s+/g, '_') || 'non_renseigne'
}

function getProfileStatusLabel(status?: string | null) {
  const normalized = normalizeProfileStatus(status)
  const labels: Record<string, string> = {
    active: 'Validé',
    approved: 'Validé',
    inactive: 'Inactif',
    pending: 'À vérifier',
    pending_review: 'À vérifier',
    requested: 'Demandé',
    rejected: 'Refusé',
    suspended: 'Suspendu',
    unverified: 'À vérifier',
    non_renseigne: 'Non renseigné',
  }

  return labels[normalized] || normalizeText(status).replace(/_/g, ' ')
}

function getReviewPriority(profile: AdminProfileRow) {
  const status = normalizeProfileStatus(profile.profile_status)
  return isActive(profile) && ['active', 'approved'].includes(status) ? 1 : 0
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
  if (action === 'deactivate') return 'Suspendre'
  if (action === 'reactivate') return 'Réactiver'
  if (action === 'update_role') return 'Modifier le rôle'
  return 'Supprimer définitivement'
}

function getSuccessMessage(action: AdminProfileAction) {
  if (action === 'deactivate') return 'Profil suspendu.'
  if (action === 'reactivate') return 'Profil réactivé.'
  if (action === 'update_role') return 'Rôle modifié.'
  return 'Profil supprimé.'
}

function getVisibleActionError(action: AdminProfileAction, error: unknown) {
  if (action !== 'delete' || !(error instanceof Error)) {
    return 'Cette action n’a pas pu être effectuée.'
  }

  const safeMessages = [
    'Ce profil possède des données liées et ne peut pas être supprimé.',
    'Le dernier administrateur actif ne peut pas être supprimé.',
    'Vous ne pouvez pas supprimer votre propre profil.',
    'Profil cible introuvable.',
  ]

  return safeMessages.find((message) => error.message.includes(message))
    || 'La suppression définitive n’a pas pu être effectuée. Le profil est conservé.'
}

function getBlockedReason({
  self,
  lastActiveAdmin,
}: {
  self: boolean
  lastActiveAdmin: boolean
}) {
  if (self) return 'Action bloquée : vous ne pouvez pas modifier votre propre profil.'
  if (lastActiveAdmin) return 'Action bloquée : dernier admin actif.'
  return null
}

function runProfileAction(profileId: string, action: AdminProfileAction) {
  if (action === 'deactivate') return deactivateProfile(profileId)
  if (action === 'reactivate') return reactivateProfile(profileId)
  return deleteProfile(profileId)
}

function getActivationLabel(profile: AdminProfileRow) {
  return normalizeProfileStatus(profile.profile_status) === 'suspended' ? 'Réactiver' : 'Activer'
}

export default function AdminProfilesPage() {
  const { profile: currentProfile } = useAuth()
  const [profiles, setProfiles] = useState<AdminProfileRow[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [profileStatusFilter, setProfileStatusFilter] = useState<ProfileStatusFilter>('all')
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [selectedRole, setSelectedRole] = useState<AdminAssignableRole>('member')
  const [sensitiveRoleConfirmed, setSensitiveRoleConfirmed] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  )
  const [technicalError, setTechnicalError] = useState<string | null>(null)

  const activeAdminCount = useMemo(
    () =>
      profiles.filter(
        (item) => isActive(item) && isAdminProfileRole(item.role),
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

  const availableProfileStatuses = useMemo(() => {
    const statuses = new Map<string, string>()
    profiles.forEach((profile) => {
      const value = normalizeProfileStatus(profile.profile_status)
      statuses.set(value, getProfileStatusLabel(profile.profile_status))
    })
    return Array.from(statuses, ([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr'))
  }, [profiles])

  const filteredProfiles = useMemo(() => {
    const queryTerms = normalizeSearchValue(searchTerm).split(' ').filter(Boolean)

    return profiles.filter((item) => {
      const normalizedRole = normalizeRole(item.role)
      const active = isActive(item)

      if (roleFilter !== 'all' && normalizedRole !== roleFilter) return false
      if (statusFilter === 'active' && !active) return false
      if (statusFilter === 'inactive' && active) return false
      if (
        profileStatusFilter !== 'all' &&
        normalizeProfileStatus(item.profile_status) !== profileStatusFilter
      ) return false

      if (queryTerms.length === 0) return true

      const searchable = [item.full_name, item.email, normalizedRole, getRoleLabel(normalizedRole)]
        .map(normalizeSearchValue)
        .join(' ')

      return queryTerms.every((term) => searchable.includes(term))
    }).sort((a, b) => (
      getReviewPriority(a) - getReviewPriority(b) ||
      getDisplayName(a).localeCompare(getDisplayName(b), 'fr', { sensitivity: 'base' })
    ))
  }, [profiles, profileStatusFilter, roleFilter, searchTerm, statusFilter])

  const activeFilterCount = [roleFilter, statusFilter, profileStatusFilter]
    .filter((value) => value !== 'all').length

  function resetFilters() {
    setRoleFilter('all')
    setStatusFilter('all')
    setProfileStatusFilter('all')
  }

  const activeCount = useMemo(
    () => profiles.filter((item) => isActive(item)).length,
    [profiles],
  )

  const inactiveCount = profiles.length - activeCount

  const loadProfiles = useCallback(async (options?: { keepToast?: boolean }) => {
    try {
      setLoading(true)
      setLoadFailed(false)
      setTechnicalError(null)
      if (!options?.keepToast) setToast(null)
      const rows = await listProfiles()
      setProfiles(rows)
    } catch (error) {
      setLoadFailed(true)
      setTechnicalError(error instanceof Error ? error.message : String(error))
      setToast({ type: 'error', message: 'Les profils n’ont pas pu être chargés.' })
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
    return isActive(profile) && isAdminProfileRole(profile.role) && activeAdminCount <= 1
  }

  function openAction(profile: AdminProfileRow, action: AdminProfileAction) {
    setDeleteConfirmation('')
    const normalizedRole = normalizeRole(profile.role)
    setSelectedRole(isAdminAssignableRole(normalizedRole) ? normalizedRole : 'member')
    setSensitiveRoleConfirmed(false)
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
      if (action === 'update_role' && !isAdminAssignableRole(selectedRole)) {
        setToast({ type: 'error', message: 'Sélectionnez un rôle autorisé.' })
        return
      }

      if (action === 'update_role' && isSensitiveAdminRole(selectedRole) && !sensitiveRoleConfirmed) {
        setToast({ type: 'error', message: 'Confirmez explicitement ce rôle sensible.' })
        return
      }

      if (
        action === 'update_role' &&
        wouldRemoveLastActiveAdmin(profile) &&
        selectedRole !== 'admin'
      ) {
        setToast({ type: 'error', message: 'Le dernier administrateur actif doit conserver son rôle.' })
        return
      }

      const result = action === 'update_role'
        ? await updateProfileRole(profile.id, selectedRole)
        : await runProfileAction(profile.id, action)
      setPendingAction(null)
      setDeleteConfirmation('')
      setToast({ type: 'success', message: result.warning || getSuccessMessage(action) })
      await loadProfiles({ keepToast: true })
    } catch (error) {
      setTechnicalError(error instanceof Error ? error.message : String(error))
      setToast({ type: 'error', message: getVisibleActionError(action, error) })
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <section className="admin-profiles-page bcvb-page">
      <PageShell variant="wide">
      <PageHeader
        eyebrow="Administration"
        title="Gestion des membres"
        subtitle="Recherchez un membre et contrôlez son rôle et son statut."
        action={<button type="button" className="bcvb-premium-button bcvb-premium-button--ghost" onClick={() => loadProfiles()} disabled={loading}>Actualiser</button>}
      />

      <div className="admin-profiles-hero__stats">
        <StatCard label="Total" value={profiles.length} />
        <StatCard label="Actifs" value={activeCount} />
        <StatCard label="Inactifs" value={inactiveCount} />
      </div>

      <section className="admin-profiles-toolbar" aria-label="Filtres profils">
        <div className="admin-profiles-search">
          <label htmlFor="admin-member-search">Rechercher un membre</label>
          <div className="admin-profiles-search__field">
            <input
              id="admin-member-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Nom ou email"
            />
            {searchTerm ? (
              <button type="button" onClick={() => setSearchTerm('')} aria-label="Effacer la recherche">
                Effacer
              </button>
            ) : null}
          </div>
        </div>

        <details className="admin-profiles-filters">
          <summary>Filtres{activeFilterCount ? ` (${activeFilterCount})` : ''}</summary>
          <div className="admin-profiles-filters__content">
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

            <label>
              <span>État du profil</span>
              <select
                value={profileStatusFilter}
                onChange={(event) => setProfileStatusFilter(event.target.value)}
              >
                <option value="all">Tous les états</option>
                {availableProfileStatuses.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="admin-profiles-filters__reset"
              onClick={resetFilters}
              disabled={activeFilterCount === 0}
            >
              Réinitialiser les filtres
            </button>
          </div>
        </details>

        {!loading && !loadFailed ? (
          <p className="admin-profiles-results" role="status" aria-live="polite">
            {filteredProfiles.length} {filteredProfiles.length > 1 ? 'profils affichés' : 'profil affiché'} sur {profiles.length}
          </p>
        ) : null}
      </section>

      {toast ? (
        toast.type === 'success'
          ? <SuccessFeedback title="Action terminée" description={toast.message} />
          : <ErrorState description={toast.message} action={<RetryAction onClick={() => loadProfiles()} />} technicalDetail={technicalError} isAdmin />
      ) : null}

      {!loadFailed ? <div className="admin-profiles-tableWrap responsive-data-table">
        <table className="admin-profiles-table">
          <thead>
            <tr>
              <th>Profil</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>État du profil</th>
              <th>Création</th>
              <th>Mise à jour</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}><LoadingState title="Chargement des profils" description="La liste des membres est en cours de récupération." /></td>
              </tr>
            ) : null}

            {!loading && filteredProfiles.length === 0 ? (
              <tr>
                <td colSpan={7}><CommonEmptyState cause={profiles.length === 0 ? 'no_data' : 'no_results'} title="Aucun profil trouvé" /></td>
              </tr>
            ) : null}

            {!loading
              ? filteredProfiles.map((item) => {
                  const active = isActive(item)
                  const self = isSelf(item)
                  const lastActiveAdmin = wouldRemoveLastActiveAdmin(item)
                  const actionDisabled = actionLoadingId === item.id
                  const blockedReason = getBlockedReason({ self, lastActiveAdmin })

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
                      <td>{getProfileStatusLabel(item.profile_status)}</td>
                      <td>{formatDate(item.created_at)}</td>
                      <td>{formatDate(item.updated_at)}</td>
                      <td>
                        <div className="admin-profiles-actions">
                          <button
                            type="button"
                            onClick={() => openAction(item, 'update_role')}
                            disabled={self || actionDisabled}
                          >
                            Gérer le rôle
                          </button>
                          {active ? (
                            <button
                              type="button"
                              className="is-warning"
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
                              Suspendre
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openAction(item, 'reactivate')}
                              disabled={actionDisabled}
                            >
                              {getActivationLabel(item)}
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
                        {blockedReason ? (
                          <small className="admin-profiles-actionHint">{blockedReason}</small>
                        ) : null}
                      </td>
                    </tr>
                  )
                })
              : null}
          </tbody>
        </table>
      </div> : null}
      {!loadFailed ? <div className="responsive-data-mobile admin-profiles-mobileList">
        {loading ? (
          <LoadingState title="Chargement des profils" description="La liste des membres est en cours de récupération." />
        ) : (
          <ResponsiveDataList
            empty={<CommonEmptyState cause={profiles.length === 0 ? 'no_data' : 'no_results'} title="Aucun profil trouvé" />}
          >
            {filteredProfiles.map((item) => {
              const active = isActive(item)
              const self = isSelf(item)
              const lastActiveAdmin = wouldRemoveLastActiveAdmin(item)
              const actionDisabled = actionLoadingId === item.id
              const blockedReason = getBlockedReason({ self, lastActiveAdmin })

              return (
                <MobileDetailCard
                  key={item.id}
                  tone={active ? 'is-valid' : 'is-muted'}
                  eyebrow={getRoleLabel(item.role)}
                  title={getDisplayName(item)}
                  subtitle={item.email || 'Email absent'}
                  badge={<StatusBadge tone={active ? 'success' : 'warning'}>{active ? 'Actif' : 'Inactif'}</StatusBadge>}
                  items={[
                    { label: 'Création', value: formatDate(item.created_at) },
                    { label: 'Mise à jour', value: formatDate(item.updated_at) },
                    { label: 'État du profil', value: getProfileStatusLabel(item.profile_status) },
                    { label: 'Sécurité', value: blockedReason || 'Action possible', full: true },
                  ]}
                  actions={(
                    <>
                      <button
                        type="button"
                        onClick={() => openAction(item, 'update_role')}
                        disabled={self || actionDisabled}
                      >
                        Gérer le rôle
                      </button>
                      {active ? (
                        <button
                          type="button"
                          className="is-warning"
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
                          Suspendre
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openAction(item, 'reactivate')}
                          disabled={actionDisabled}
                        >
                          {getActivationLabel(item)}
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
                        Supprimer définitivement
                      </button>
                    </>
                  )}
                />
              )
            })}
          </ResponsiveDataList>
        )}
      </div> : null}

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
            <p className="admin-profiles-modal__email">
              {pendingAction.profile.email || 'Email non renseigné'}
            </p>

            {pendingAction.action === 'update_role' ? (
              <>
                <label>
                  <span>Nouveau rôle</span>
                  <select
                    value={selectedRole}
                    onChange={(event) => {
                      const role = event.target.value
                      if (isAdminAssignableRole(role)) setSelectedRole(role)
                      setSensitiveRoleConfirmed(false)
                    }}
                  >
                    {ADMIN_ASSIGNABLE_ROLES.map((role) => (
                      <option key={role} value={role}>{getRoleLabel(role)}</option>
                    ))}
                  </select>
                </label>
                {isSensitiveAdminRole(selectedRole) ? (
                  <label className="admin-profiles-sensitiveConfirmation">
                    <input
                      type="checkbox"
                      checked={sensitiveRoleConfirmed}
                      onChange={(event) => setSensitiveRoleConfirmed(event.target.checked)}
                    />
                    <span>Je confirme l’attribution de ce rôle sensible.</span>
                  </label>
                ) : null}
              </>
            ) : pendingAction.action === 'delete' ? (
              <>
                <div className="admin-profiles-deleteWarning" role="note">
                  <strong>Suppression exceptionnelle et irréversible</strong>
                  <p>Le compte Auth et le profil seront supprimés uniquement si aucune donnée métier ne les bloque.</p>
                </div>
                {isActive(pendingAction.profile) ? (
                  <button
                    type="button"
                    className="admin-profiles-suspendAlternative"
                    onClick={() => openAction(pendingAction.profile, 'deactivate')}
                  >
                    Suspendre le compte à la place
                  </button>
                ) : (
                  <p>Ce compte est déjà inactif. Vérifiez que sa suppression définitive est indispensable.</p>
                )}
                <label>
                  <span>Tape SUPPRIMER pour confirmer</span>
                  <input
                    aria-label="Confirmation de suppression définitive"
                    value={deleteConfirmation}
                    onChange={(event) => setDeleteConfirmation(event.target.value)}
                    placeholder="SUPPRIMER"
                  />
                </label>
              </>
            ) : (
              <p>{pendingAction.action === 'deactivate'
                ? 'La suspension coupe immédiatement l’accès sans supprimer le profil. Une réactivation restera possible.'
                : 'La réactivation rétablit immédiatement l’accès au profil.'}</p>
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
                  (pendingAction.action === 'delete' && deleteConfirmation !== 'SUPPRIMER') ||
                  (pendingAction.action === 'update_role' && (
                    selectedRole === normalizeRole(pendingAction.profile.role) ||
                    (isSensitiveAdminRole(selectedRole) && !sensitiveRoleConfirmed) ||
                    (wouldRemoveLastActiveAdmin(pendingAction.profile) && selectedRole !== 'admin')
                  ))
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
      </PageShell>
    </section>
  )
}
