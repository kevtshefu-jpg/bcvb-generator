import { Link } from 'react-router-dom'

export default function AccessDeniedPage() {
  return (
    <section className="access-denied">
      <div className="access-denied__card">
        <p className="access-denied__eyebrow">Accès restreint</p>
        <h1 className="access-denied__title">Vous n’avez pas les droits nécessaires</h1>
        <p className="access-denied__text">
          Cette section est réservée à certains profils membres. Revenez au tableau de bord
          ou contactez un administrateur du BCVB si besoin.
        </p>

        <div className="access-denied__actions">
          <Link to="/dashboard" className="access-denied__primary">
            Retour au dashboard
          </Link>
        </div>
      </div>
    </section>
  )
}
