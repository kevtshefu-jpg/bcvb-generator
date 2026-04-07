import { useAuth } from '../../auth/context/AuthContext'
import { useRegistrationRequests } from '../hooks/useRegistrationRequests'

function getStatusLabel(status: string) {
  if (status === 'approved') return 'Approuvée'
  if (status === 'rejected') return 'Refusée'
  return 'En attente'
}

export default function AdminRegistrationRequestsPage() {
  const { user } = useAuth()
  const { requests, loading, error, setStatus } = useRegistrationRequests(user?.id)

  return (
    <section className="dashboard-page">
      <div className="dashboard-page__hero">
        <div>
          <p className="dashboard-page__eyebrow">Administration</p>
          <h2 className="dashboard-page__title">Demandes d’inscription</h2>
          <p className="dashboard-page__text">
            Consulte, approuve ou refuse les demandes envoyées par les visiteurs.
          </p>
        </div>

        <div className="dashboard-page__badge">
          <span className="dashboard-page__badgeLabel">File active</span>
          <strong>{requests.length}</strong>
        </div>
      </div>

      {loading && <p>Chargement des demandes...</p>}
      {error && <p>{error}</p>}

      <div className="dashboard-page__grid">
        {requests.map((item) => (
          <article className="dashboard-actionCard" key={item.id}>
            <p className="dashboard-page__eyebrow">{getStatusLabel(item.status)}</p>
            <h3 className="dashboard-actionCard__title">
              {item.first_name} {item.last_name}
            </h3>

            <p className="dashboard-actionCard__text">
              <strong>Email :</strong> {item.email}
            </p>
            <p className="dashboard-actionCard__text">
              <strong>Téléphone :</strong> {item.phone || '—'}
            </p>
            <p className="dashboard-actionCard__text">
              <strong>Année :</strong> {item.birth_year || '—'}
            </p>
            <p className="dashboard-actionCard__text">
              <strong>Catégorie demandée :</strong> {item.category_requested}
            </p>
            <p className="dashboard-actionCard__text">
              <strong>Type :</strong> {item.role_requested}
            </p>
            <p className="dashboard-actionCard__text">
              <strong>Notes :</strong> {item.notes || '—'}
            </p>

            {item.status === 'pending' && (
              <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                <button
                  className="bcvb-primary-btn"
                  onClick={() => setStatus(item.id, 'approved')}
                >
                  Approuver
                </button>

                <button
                  className="bcvb-btn danger"
                  onClick={() => setStatus(item.id, 'rejected')}
                >
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