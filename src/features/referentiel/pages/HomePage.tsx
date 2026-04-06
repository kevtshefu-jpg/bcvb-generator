import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'

export default function HomePage() {
  const { user, profile } = useAuth()

  const isConnected = Boolean(user)
  const isAdmin = profile?.role === 'admin'
  const isDirigeant = profile?.role === 'dirigeant'

  return (
    <section className="home-page v33-home">
      <div className="v33-hero">
        <div className="v33-hero__main">
          <p className="v33-hero__eyebrow">BCVB Référentiel</p>
          <h2 className="v33-hero__title">
            Le centre technique et pédagogique du BCVB.
          </h2>
          <p className="v33-hero__text">
            Prépare les séances, structure les contenus, retrouve les situations et renforce une
            identité commune autour de la philosophie du club.
          </p>

          <div className="v33-hero__actions">
            {isConnected ? (
              <>
                <Link to="/dashboard" className="v33-btn v33-btn--primary">
                  Ouvrir le tableau de bord
                </Link>
                <Link to="/generateur" className="v33-btn v33-btn--dark">
                  Créer une séance
                </Link>
              </>
            ) : (
              <>
                <Link to="/connexion" className="v33-btn v33-btn--primary">
                  Accéder à l’espace membre
                </Link>
                <Link to="/connexion" className="v33-btn v33-btn--ghost">
                  Se connecter
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="v33-hero__side">
          <article className="v33-highlightCard v33-highlightCard--dark">
            <span className="v33-highlightCard__label">Identité BCVB</span>
            <strong className="v33-highlightCard__value">Défendre fort</strong>
            <span className="v33-highlightCard__sub">Courir • Partager la balle</span>
          </article>

          <article className="v33-highlightCard">
            <span className="v33-highlightCard__label">Démarche pédagogique</span>
            <strong className="v33-highlightCard__value">4 étapes</strong>
            <span className="v33-highlightCard__sub">
              Je découvre • Je m’exerce • Je retranscris • Je régule
            </span>
          </article>
        </div>
      </div>

      <div className="v33-sectionHead">
        <div>
          <p className="v33-sectionHead__eyebrow">Accès rapides</p>
          <h3 className="v33-sectionHead__title">Commencer rapidement</h3>
        </div>
        <span className="v33-sectionHead__badge">BCVB • V3.3</span>
      </div>

      <div className="v33-grid">
        <Link to={isConnected ? '/generateur' : '/connexion'} className="v33-card v33-card--accent">
          <p className="v33-card__eyebrow">Production</p>
          <h3 className="v33-card__title">Générateur de séance</h3>
          <p className="v33-card__text">
            Structure rapidement une séance propre, lisible et cohérente avec l’identité BCVB.
          </p>
          <span className="v33-card__link">Ouvrir le générateur</span>
        </Link>

        <Link to={isConnected ? '/situations' : '/connexion'} className="v33-card">
          <p className="v33-card__eyebrow">Bibliothèque</p>
          <h3 className="v33-card__title">Banque de situations</h3>
          <p className="v33-card__text">
            Retrouve et capitalise les contenus techniques et pédagogiques du club.
          </p>
          <span className="v33-card__link">Voir les situations</span>
        </Link>

        <Link to={isConnected ? '/categories' : '/connexion'} className="v33-card">
          <p className="v33-card__eyebrow">Formation</p>
          <h3 className="v33-card__title">Parcours par catégorie</h3>
          <p className="v33-card__text">
            Clarifie les priorités d’apprentissage et la progression de chaque niveau.
          </p>
          <span className="v33-card__link">Ouvrir les catégories</span>
        </Link>

        <Link to={isConnected ? '/themes' : '/connexion'} className="v33-card">
          <p className="v33-card__eyebrow">Jeu</p>
          <h3 className="v33-card__title">Thèmes de jeu</h3>
          <p className="v33-card__text">
            Organise les contenus autour des thèmes prioritaires du référentiel club.
          </p>
          <span className="v33-card__link">Voir les thèmes</span>
        </Link>
      </div>

      <div className="v33-bottomGrid">
        <article className="v33-panel">
          <p className="v33-panel__eyebrow">Cadre club</p>
          <h3 className="v33-panel__title">Repères BCVB</h3>
          <ul className="v33-list">
            <li>Défense Homme à Homme comme base identitaire</li>
            <li>Axes : intensité, agressivité, maîtrise, jeu</li>
            <li>Documents et outils prêts à l’emploi</li>
          </ul>
        </article>

        <article className="v33-panel">
          <p className="v33-panel__eyebrow">Usage</p>
          <h3 className="v33-panel__title">Priorités du moment</h3>
          <div className="v33-pillList">
            <span className="v33-pill">Structurer les séances</span>
            <span className="v33-pill">Capitaliser les situations</span>
            <span className="v33-pill">Harmoniser les contenus</span>
            <span className="v33-pill">Renforcer l’identité club</span>
          </div>
          {(isAdmin || isDirigeant) && (
            <div className="v33-panel__actions">
              <Link to="/club" className="v33-inlineLink">
                Ouvrir l’espace club
              </Link>
            </div>
          )}
        </article>
      </div>
    </section>
  )
}