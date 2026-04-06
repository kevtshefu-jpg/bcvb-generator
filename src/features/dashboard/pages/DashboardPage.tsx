import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'

export default function DashboardPage() {
  const { profile } = useAuth()

  const roleLabel =
    profile?.role === 'admin'
      ? 'Administrateur'
      : profile?.role === 'dirigeant'
        ? 'Dirigeant'
        : profile?.role === 'coach'
          ? 'Coach'
          : 'Membre'

  return (
    <section className="dashboard-page">
      <div className="dashboard-page__hero">
        <div>
          <p className="dashboard-page__eyebrow">Tableau de bord</p>
          <h2 className="dashboard-page__title">Pilote ton espace BCVB</h2>
          <p className="dashboard-page__text">
            Retrouve les accès prioritaires, les contenus clés du club et les outils de production
            pour préparer, structurer et faire vivre le référentiel BCVB.
          </p>
        </div>

        <div className="dashboard-page__badge">
          <span className="dashboard-page__badgeLabel">Profil actif</span>
          <strong>{roleLabel}</strong>
        </div>
      </div>

      <div className="dashboard-page__stats">
        <article className="dashboard-stat">
          <span className="dashboard-stat__label">Identité</span>
          <strong className="dashboard-stat__value">Défendre fort</strong>
          <span className="dashboard-stat__sub">Courir • Partager la balle</span>
        </article>

        <article className="dashboard-stat">
          <span className="dashboard-stat__label">Pédagogie</span>
          <strong className="dashboard-stat__value">4 étapes</strong>
          <span className="dashboard-stat__sub">Découvrir • S’exercer • Retranscrire • Réguler</span>
        </article>

        <article className="dashboard-stat">
          <span className="dashboard-stat__label">Usage</span>
          <strong className="dashboard-stat__value">Référentiel</strong>
          <span className="dashboard-stat__sub">Séances • Situations • Structuration club</span>
        </article>
      </div>

      <div className="dashboard-page__grid">
        <Link to="/generateur" className="dashboard-actionCard">
          <p className="dashboard-actionCard__eyebrow">Production</p>
          <h3 className="dashboard-actionCard__title">Générateur de séance</h3>
          <p className="dashboard-actionCard__text">
            Construis rapidement une séance claire, structurée et cohérente avec l’identité BCVB.
          </p>
        </Link>

        <Link to="/situations" className="dashboard-actionCard">
          <p className="dashboard-actionCard__eyebrow">Bibliothèque</p>
          <h3 className="dashboard-actionCard__title">Banque de situations</h3>
          <p className="dashboard-actionCard__text">
            Accède aux exercices, retrouve les contenus utiles et enrichis la mémoire technique du
            club.
          </p>
        </Link>

        <Link to="/themes" className="dashboard-actionCard">
          <p className="dashboard-actionCard__eyebrow">Référentiel</p>
          <h3 className="dashboard-actionCard__title">Thèmes de jeu</h3>
          <p className="dashboard-actionCard__text">
            Organise les contenus par thèmes pour mieux planifier la progression individuelle et
            collective.
          </p>
        </Link>

        <Link to="/categories" className="dashboard-actionCard">
          <p className="dashboard-actionCard__eyebrow">Formation</p>
          <h3 className="dashboard-actionCard__title">Parcours par catégorie</h3>
          <p className="dashboard-actionCard__text">
            Clarifie les priorités d’apprentissage et donne un fil conducteur cohérent à chaque
            niveau.
          </p>
        </Link>
      </div>
    </section>
  )
}
