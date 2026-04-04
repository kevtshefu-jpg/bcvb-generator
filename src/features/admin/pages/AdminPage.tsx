import { useAuth } from '../../auth/context/AuthContext'

export default function AdminPage() {
  const { profile } = useAuth()

  return (
    <section className="admin-page">
      <div className="admin-page__hero">
        <p className="admin-page__eyebrow">Administration</p>
        <h2 className="admin-page__title">Gestion des accès</h2>
        <p className="admin-page__text">
          Espace réservé aux administrateurs. Cette zone servira à piloter les membres, les rôles et les accès.
        </p>
      </div>

      <div className="admin-page__grid">
        <article className="admin-page__card">
          <h3>Compte connecté</h3>
          <p><strong>Email :</strong> {profile?.email}</p>
          <p><strong>Rôle :</strong> {profile?.role}</p>
          <p><strong>Actif :</strong> {profile?.is_active ? 'Oui' : 'Non'}</p>
        </article>

        <article className="admin-page__card">
          <h3>Prochaine évolution</h3>
          <p>Tableau des membres</p>
          <p>Activation / désactivation</p>
          <p>Changement de rôle</p>
        </article>
      </div>
    </section>
  )
}
