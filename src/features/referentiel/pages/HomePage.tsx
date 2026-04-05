import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'

export default function HomePage() {
  const { user, profile } = useAuth()

  const isConnected = Boolean(user)
  const isAdmin = profile?.role === 'admin'
  const isDirigeant = profile?.role === 'dirigeant'

  return (
    <section className="home-page">
      <div className="home-hero">
        <div className="home-hero__content">
          <p className="home-hero__eyebrow">BCVB Référentiel</p>
          <h2 className="home-hero__title">
            Le socle technique, pédagogique et terrain du club.
          </h2>
          <p className="home-hero__text">
            Centralise les contenus de formation, prépare les séances, structure la progression
            des catégories et renforce l’identité BCVB autour d’un cadre commun.
          </p>

          <div className="home-hero__actions">
            {isConnected ? (
              <>
                <Link to="/dashboard" className="home-btn home-btn--primary">
                  Ouvrir le tableau de bord
                </Link>
                <Link to="/generateur" className="home-btn home-btn--ghost">
                  Créer une séance
                </Link>
              </>
            ) : (
              <>
                <Link to="/connexion" className="home-btn home-btn--primary">
                  Accéder à l’espace membre
                </Link>
                <Link to="/" className="home-btn home-btn--ghost">
                  Découvrir la plateforme
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="home-hero__aside">
          <div className="home-statCard">
            <span className="home-statCard__label">Philosophie club</span>
            <strong className="home-statCard__value">Défendre fort</strong>
            <span className="home-statCard__sub">Courir • Partager la balle</span>
          </div>

          <div className="home-statCard">
            <span className="home-statCard__label">Démarche pédagogique</span>
            <strong className="home-statCard__value">4 étapes</strong>
            <span className="home-statCard__sub">
              Je découvre • Je m’exerce • Je retranscris • Je régule
            </span>
          </div>
        </div>
      </div>

      <div className="home-grid">
        <article className="home-card">
          <p className="home-card__eyebrow">Référentiel</p>
          <h3 className="home-card__title">Former avec un cadre commun</h3>
          <p className="home-card__text">
            Retrouve les catégories, les thèmes de jeu, les situations et les repères structurants
            pour harmoniser le travail de tous les coachs BCVB.
          </p>
          <div className="home-card__actions">
            <Link to={isConnected ? '/categories' : '/connexion'} className="home-link">
              Ouvrir les catégories
            </Link>
          </div>
        </article>

        <article className="home-card">
          <p className="home-card__eyebrow">Production</p>
          <h3 className="home-card__title">Construire des séances plus vite</h3>
          <p className="home-card__text">
            Utilise le générateur pour structurer les contenus terrain, ordonner les temps de
            séance et produire des supports plus propres pour les coachs.
          </p>
          <div className="home-card__actions">
            <Link to={isConnected ? '/generateur' : '/connexion'} className="home-link">
              Ouvrir le générateur
            </Link>
          </div>
        </article>

        <article className="home-card">
          <p className="home-card__eyebrow">Bibliothèque</p>
          <h3 className="home-card__title">Capitaliser les contenus du club</h3>
          <p className="home-card__text">
            Classe, retrouve et fais évoluer les situations, les thèmes et les contenus techniques
            pour gagner du temps et renforcer la continuité de formation.
          </p>
          <div className="home-card__actions">
            <Link to={isConnected ? '/bibliotheque' : '/connexion'} className="home-link">
              Accéder à la bibliothèque
            </Link>
          </div>
        </article>

        <article className="home-card">
          <p className="home-card__eyebrow">Identité BCVB</p>
          <h3 className="home-card__title">Un cadre lisible pour tout le club</h3>
          <ul className="home-list">
            <li>Défense Homme à Homme comme identité de base</li>
            <li>Axes intensité • agressivité • maîtrise • jeu</li>
            <li>Documents et outils prêts à l’emploi</li>
          </ul>
          {(isAdmin || isDirigeant) && (
            <div className="home-card__actions">
              <Link to="/club" className="home-link">
                Ouvrir l’espace club
              </Link>
            </div>
          )}
        </article>
      </div>
    </section>
  )
}