import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'

export default function HomePage() {
  const { user, profile } = useAuth()

  const isConnected = Boolean(user)
  const isAdmin = profile?.role === 'admin'
  const isDirigeant = profile?.role === 'dirigeant'

  return (
    <section className="home-page">
      <div className="dashboard-hero">
        <div className="dashboard-hero__main">
          <p className="dashboard-hero__eyebrow">BCVB Référentiel</p>
          <h2 className="dashboard-hero__title">
            La plateforme technique, pédagogique et terrain du BCVB.
          </h2>
          <p className="dashboard-hero__text">
            Un seul espace pour structurer les contenus de formation, préparer les séances,
            retrouver les situations et renforcer l’identité de jeu du club.
          </p>

          <div className="dashboard-hero__actions">
            {isConnected ? (
              <>
                <Link to="/dashboard" className="dashboard-btn dashboard-btn--primary">
                  Ouvrir le tableau de bord
                </Link>
                <Link to="/generateur" className="dashboard-btn dashboard-btn--dark">
                  Créer une séance
                </Link>
              </>
            ) : (
              <>
                <Link to="/connexion" className="dashboard-btn dashboard-btn--primary">
                  Accéder à l’espace membre
                </Link>
                <Link to="/connexion" className="dashboard-btn dashboard-btn--ghost">
                  Se connecter
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="dashboard-hero__side">
          <div className="dashboard-kpiCard">
            <span className="dashboard-kpiCard__label">Philosophie BCVB</span>
            <strong className="dashboard-kpiCard__value">Défendre fort</strong>
            <span className="dashboard-kpiCard__sub">Courir • Partager la balle</span>
          </div>

          <div className="dashboard-kpiCard dashboard-kpiCard--light">
            <span className="dashboard-kpiCard__label">Pédagogie</span>
            <strong className="dashboard-kpiCard__value">4 étapes</strong>
            <span className="dashboard-kpiCard__sub">
              Je découvre • Je m’exerce • Je retranscris • Je régule
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-quickGrid">
        <article className="dashboard-panelCard">
          <p className="dashboard-panelCard__eyebrow">Référentiel</p>
          <h3 className="dashboard-panelCard__title">Structurer la formation</h3>
          <p className="dashboard-panelCard__text">
            Catégories, thèmes, situations et contenus partagés pour harmoniser le travail des
            coachs et donner un cadre commun au club.
          </p>
          <Link to={isConnected ? '/categories' : '/connexion'} className="dashboard-inlineLink">
            Ouvrir les catégories
          </Link>
        </article>

        <article className="dashboard-panelCard">
          <p className="dashboard-panelCard__eyebrow">Production</p>
          <h3 className="dashboard-panelCard__title">Préparer plus vite les séances</h3>
          <p className="dashboard-panelCard__text">
            Génère, organise et reformule tes contenus terrain pour aller plus vite et produire des
            supports plus propres.
          </p>
          <Link to={isConnected ? '/generateur' : '/connexion'} className="dashboard-inlineLink">
            Ouvrir le générateur
          </Link>
        </article>

        <article className="dashboard-panelCard">
          <p className="dashboard-panelCard__eyebrow">Bibliothèque</p>
          <h3 className="dashboard-panelCard__title">Capitaliser les contenus BCVB</h3>
          <p className="dashboard-panelCard__text">
            Retrouve rapidement les situations, classe-les par thèmes et fais vivre la mémoire
            technique du club.
          </p>
          <Link to={isConnected ? '/bibliotheque' : '/connexion'} className="dashboard-inlineLink">
            Accéder à la bibliothèque
          </Link>
        </article>

        <article className="dashboard-panelCard">
          <p className="dashboard-panelCard__eyebrow">Identité club</p>
          <h3 className="dashboard-panelCard__title">Donner de la cohérence à tous les coachs</h3>
          <ul className="dashboard-list">
            <li>Défense Homme à Homme comme base identitaire</li>
            <li>Axes : intensité, agressivité, maîtrise, jeu</li>
            <li>Supports prêts à l’emploi pour gagner du temps</li>
          </ul>
          {(isAdmin || isDirigeant) && (
            <Link to="/club" className="dashboard-inlineLink">
              Ouvrir l’espace club
            </Link>
          )}
        </article>
      </div>
    </section>
  )
}