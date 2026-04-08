import { useAuth } from '../../auth/context/AuthContext'
import { useRegistrationRequests } from '../hooks/useRegistrationRequests'

function getStatusLabel(status: string) {
  if (status === 'approved') return 'Approuvée'
  if (status === 'rejected') return 'Refusée'
  return 'En attente'
}

export default function AdminRegistrationRequestsPage() {
  const { user } = useAuth()
  const { requests, loading, error, approve, reject, lastCreatedPassword } =
    useRegistrationRequests(user?.id)

  return (
    <section className="dashboard-page">
      <div className="dashboard-page__hero">
        <div>
          <p className="dashboard-page__eyebrow">Administration</p>
          <h2 className="dashboard-page__title">Demandes d’inscription</h2>
          <p className="dashboard-page__text">
            Valide une demande pour créer un vrai compte utilisateur et son profil club.
          </p>
        </div>

        <div className="dashboard-page__badge">
          <span className="dashboard-page__badgeLabel">Demandes</span>
          <strong>{requests.length}</strong>
        </div>
      </div>

      {loading && <p>Chargement des demandes...</p>}
      {error && <p>{error}</p>}

      {lastCreatedPassword && (
        <article className="dashboard-panelCard">
          <h3 className="dashboard-panelCard__title">Compte créé</h3>
          <p className="dashboard-actionCard__text">
            Mot de passe temporaire : <strong>{lastCreatedPassword}</strong>
          </p>
          <p className="dashboard-actionCard__text">
            Transmets-le de manière sécurisée au nouvel inscrit.
          </p>
        </article>
      )}

      <div className="dashboard-page__grid">
        {requests.map((item) => (
          <article className="dashboard-actionCard" key={item.id}>
            <p className="dashboard-page__eyebrow">{getStatusLabel(item.status)}</p>
            <h3 className="dashboard-actionCard__title">
              {item.first_name} {item.last_name}
            </h3>

            <p className="dashboard-actionCard__text"><strong>Email :</strong> {item.email}</p>
            <p className="dashboard-actionCard__text"><strong>Téléphone :</strong> {item.phone || '—'}</p>
            <p className="dashboard-actionCard__text"><strong>Année :</strong> {item.birth_year || '—'}</p>
            <p className="dashboard-actionCard__text"><strong>Catégorie demandée :</strong> {item.category_requested}</p>
            <p className="dashboard-actionCard__text"><strong>Type :</strong> {item.role_requested}</p>
            <p className="dashboard-actionCard__text"><strong>Notes :</strong> {item.notes || '—'}</p>

            {item.status === 'pending' && (
              <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                <button className="bcvb-primary-btn" onClick={() => approve(item)}>
                  Approuver et créer le compte
                </button>

                <button className="bcvb-btn danger" onClick={() => reject(item)}>
                  Refuser
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}