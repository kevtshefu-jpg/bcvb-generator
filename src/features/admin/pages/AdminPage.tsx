import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../auth/context/AuthContext'

type MemberRow = {
  id: string
  email: string | null
  full_name: string | null
  role: string | null
  is_active: boolean | null
  profile_status?: string | null
  created_at: string | null
}

type AdminCounts = {
  pendingProfileRequests: number
  pendingRegistrationRequests: number
  unreadNotifications: number
}

const initialCounts: AdminCounts = {
  pendingProfileRequests: 0,
  pendingRegistrationRequests: 0,
  unreadNotifications: 0,
}

function formatDate(value?: string | null) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleDateString('fr-FR')
}

function formatRole(value?: string | null) {
  if (!value) return '—'

  const labels: Record<string, string> = {
    admin: 'Admin',
    responsable_technique: 'Responsable technique',
    coach: 'Coach',
    joueur: 'Joueur',
    parent: 'Parent',
    parent_referent: 'Parent référent',
    team_staff: 'Staff équipe',
    dirigeant: 'Dirigeant',
    benevole: 'Bénévole',
    arbitre: 'Arbitre',
    otm: 'OTM',
    member: 'Membre',
    membre: 'Membre',
  }

  return labels[value] || value
}

function getMemberName(member: MemberRow) {
  return member.full_name?.trim() || member.email || 'Profil sans nom'
}

function getProfileStatus(member: MemberRow) {
  if (member.profile_status) return member.profile_status
  if (member.is_active === false) return 'inactive'
  return 'active'
}

function getStatusLabel(member: MemberRow) {
  const status = getProfileStatus(member)

  const labels: Record<string, string> = {
    active: 'Actif',
    inactive: 'Inactif',
    pending: 'En attente',
    rejected: 'Refusé',
    disabled: 'Désactivé',
  }

  return labels[status] || status
}

function getStatusClass(member: MemberRow) {
  const status = getProfileStatus(member)

  if (status === 'active') return 'is-active'
  if (status === 'pending') return 'is-pending'
  if (status === 'rejected' || status === 'disabled' || status === 'inactive') {
    return 'is-disabled'
  }

  return ''
}

export default function AdminPage() {
  const { profile } = useAuth()

  const [members, setMembers] = useState<MemberRow[]>([])
  const [counts, setCounts] = useState<AdminCounts>(initialCounts)
  const [loading, setLoading] = useState(true)
  const [countsLoading, setCountsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [countsError, setCountsError] = useState<string | null>(null)

  const activeMembers = useMemo(
    () => members.filter((member) => getProfileStatus(member) === 'active').length,
    [members],
  )

  const pendingMembers = useMemo(
    () => members.filter((member) => getProfileStatus(member) === 'pending').length,
    [members],
  )

  const adminSummaryStatus = useMemo(() => {
    if (loading || countsLoading) return 'Chargement'
    if (error || countsError) return 'À vérifier'
    return 'Opérationnel'
  }, [loading, countsLoading, error, countsError])

  const loadMembers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, is_active, profile_status, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      setMembers((data || []) as MemberRow[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les membres.')
      setMembers([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadCounts = useCallback(async () => {
    try {
      setCountsLoading(true)
      setCountsError(null)

      const [
        profileRequestsResponse,
        registrationRequestsResponse,
        notificationsResponse,
      ] = await Promise.all([
        supabase
          .from('profile_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),

        supabase
          .from('registration_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),

        supabase
          .from('admin_notifications')
          .select('id', { count: 'exact', head: true })
          .is('read_at', null),
      ])

      const firstError =
        profileRequestsResponse.error ||
        registrationRequestsResponse.error ||
        notificationsResponse.error

      if (firstError) {
        throw new Error(firstError.message)
      }

      setCounts({
        pendingProfileRequests: profileRequestsResponse.count || 0,
        pendingRegistrationRequests: registrationRequestsResponse.count || 0,
        unreadNotifications: notificationsResponse.count || 0,
      })
    } catch (err) {
      setCountsError(
        err instanceof Error
          ? err.message
          : 'Impossible de charger les compteurs admin.',
      )
      setCounts(initialCounts)
    } finally {
      setCountsLoading(false)
    }
  }, [])

  const refreshAdminData = useCallback(async () => {
    await Promise.all([loadMembers(), loadCounts()])
  }, [loadMembers, loadCounts])

  useEffect(() => {
    refreshAdminData()
  }, [refreshAdminData])

  return (
    <section className="admin-page">
      <div className="admin-page__hero">
        <div>
          <p className="admin-page__eyebrow">Administration</p>
          <h2 className="admin-page__title">Paramètres et administration</h2>
          <p className="admin-page__text">
            Administrer les accès, suivre les demandes, contrôler les profils membres
            et structurer les droits de la plateforme BCVB.
          </p>
        </div>

        <div className="admin-page__heroActions">
          <Link to="/admin/demandes-profils" className="admin-page__heroButton">
            Demandes profils
          </Link>

          <Link to="/admin/inscriptions" className="admin-page__heroButton admin-page__heroButton--light">
            Inscriptions
          </Link>
        </div>
      </div>

      <section className="admin-action-grid">
        <Link
          to="/admin/demandes-profils"
          className="admin-action-card admin-action-card--urgent"
        >
          <span>Priorité admin</span>
          <strong>Demandes de profils</strong>
          <p>Valider, modifier ou refuser les nouveaux accès à la plateforme.</p>

          <em>
            {countsLoading ? '...' : counts.pendingProfileRequests}
          </em>
        </Link>

        <Link to="/admin/inscriptions" className="admin-action-card">
          <span>Club</span>
          <strong>Demandes d’inscription</strong>
          <p>Consulter les demandes historiques liées au formulaire d’inscription.</p>

          <em>
            {countsLoading ? '...' : counts.pendingRegistrationRequests}
          </em>
        </Link>

        <Link to="/admin/membres" className="admin-action-card">
          <span>Membres</span>
          <strong>Gestion des membres</strong>
          <p>Contrôler les profils actifs, les rôles et les accès.</p>

          <em>{members.length}</em>
        </Link>

        <Link to="/admin/plateforme" className="admin-action-card">
          <span>Plateforme</span>
          <strong>Administration</strong>
          <p>Régler les standards, les accès et les garde-fous sensibles.</p>

          <em>{counts.unreadNotifications}</em>
        </Link>
      </section>

      <div className="admin-page__grid">
        <article className="admin-page__card">
          <h3>Compte connecté</h3>

          <div className="admin-page__infoList">
            <p>
              <strong>Email</strong>
              <span>{profile?.email || '—'}</span>
            </p>

            <p>
              <strong>Rôle</strong>
              <span>{formatRole(profile?.role)}</span>
            </p>

            <p>
              <strong>Actif</strong>
              <span>{profile?.is_active ? 'Oui' : 'Non'}</span>
            </p>
          </div>
        </article>

        <article className="admin-page__card">
          <h3>Résumé</h3>

          <div className="admin-page__infoList">
            <p>
              <strong>Membres chargés</strong>
              <span>{members.length}</span>
            </p>

            <p>
              <strong>Actifs</strong>
              <span>{activeMembers}</span>
            </p>

            <p>
              <strong>En attente</strong>
              <span>{pendingMembers}</span>
            </p>

            <p>
              <strong>Statut</strong>
              <span>{adminSummaryStatus}</span>
            </p>
          </div>
        </article>

        <article className="admin-page__card admin-page__card--dark">
          <h3>Alertes admin</h3>

          <div className="admin-page__infoList">
            <p>
              <strong>Demandes profils</strong>
              <span>{counts.pendingProfileRequests}</span>
            </p>

            <p>
              <strong>Inscriptions club</strong>
              <span>{counts.pendingRegistrationRequests}</span>
            </p>

            <p>
              <strong>Notifications</strong>
              <span>{counts.unreadNotifications}</span>
            </p>
          </div>
        </article>
      </div>

      {(error || countsError) ? (
        <div className="admin-page__message admin-page__message--error">
          <strong>Erreur de chargement</strong>
          <p>{error || countsError}</p>

          <button type="button" onClick={refreshAdminData}>
            Réessayer
          </button>
        </div>
      ) : null}

      <section className="admin-page__tableCard">
        <div className="admin-page__tableHead">
          <div>
            <p className="admin-page__eyebrow">Profils</p>
            <h3>Profils membres</h3>
          </div>

          <button type="button" onClick={refreshAdminData} disabled={loading || countsLoading}>
            {loading || countsLoading ? 'Chargement...' : 'Recharger'}
          </button>
        </div>

        {loading ? (
          <div className="admin-page__empty">
            Chargement des profils...
          </div>
        ) : members.length === 0 ? (
          <div className="admin-page__empty">
            Aucun profil trouvé.
          </div>
        ) : (
          <>
            <div className="admin-page__mobileMembers">
              {members.map((member) => (
                <article className="admin-member-card" key={member.id}>
                  <header>
                    <div>
                      <h4>{getMemberName(member)}</h4>
                      <p>{member.email || 'Email non renseigné'}</p>
                    </div>

                    <span className={`admin-member-card__status ${getStatusClass(member)}`}>
                      {getStatusLabel(member)}
                    </span>
                  </header>

                  <div className="admin-member-card__meta">
                    <p>
                      <strong>Rôle</strong>
                      <span>{formatRole(member.role)}</span>
                    </p>

                    <p>
                      <strong>Créé le</strong>
                      <span>{formatDate(member.created_at)}</span>
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <div className="admin-page__tableWrap">
              <table className="admin-page__table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Statut</th>
                    <th>Créé le</th>
                  </tr>
                </thead>

                <tbody>
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td>{member.full_name || '—'}</td>
                      <td>{member.email || '—'}</td>
                      <td>{formatRole(member.role)}</td>
                      <td>
                        <span className={`admin-page__status ${getStatusClass(member)}`}>
                          {getStatusLabel(member)}
                        </span>
                      </td>
                      <td>{formatDate(member.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </section>
  )
}
