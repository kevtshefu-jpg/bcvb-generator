import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <section className="home-hero">
      <div className="home-hero__card">
        <p className="home-hero__eyebrow">Basket Club Villefranche Beaujolais</p>
        <h1 className="home-hero__title">Plateforme membres BCVB</h1>
        <p className="home-hero__text">
          Le référentiel, les situations, le générateur et les ressources club sont réservés aux membres
          autorisés du BCVB.
        </p>

        <div className="home-hero__actions">
          <Link to="/connexion" className="home-hero__primary">
            Connexion membre
          </Link>
        </div>
      </div>
    </section>
  )
}
