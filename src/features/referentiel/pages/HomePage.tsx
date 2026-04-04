import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <section className="page-intro-card" style={{ maxWidth: 760 }}>
      <img src="/logo_bcvb copie.png" alt="BCVB" style={{ width: 92, height: 'auto', marginBottom: 12 }} />
      <h1>BCVB Platform</h1>
      <p>
        Plateforme privee reservee aux membres autorises du club. Connectez-vous pour acceder au
        dashboard et aux contenus internes.
      </p>
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <Link to="/connexion" className="primary-button">Connexion membre</Link>
        <a href="mailto:contact@bcvb.fr" className="secondary-button">Demander un acces</a>
      </div>
    </section>
  )
}
