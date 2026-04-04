import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'

function roleLabel(role?: string | null) {
  if (role === 'admin') return 'Administrateur'
  if (role === 'dirigeant') return 'Dirigeant'
  if (role === 'coach') return 'Coach'
  return 'Membre'
}

export default function DashboardPage() {
  const { profile } = useAuth()

  const quickLinks = [
    { to: '/categories', label: 'Catégories' },
    { to: '/themes', label: 'Thèmes' },
    { to: '/situations', label: 'Situations' },
    { to: '/generateur', label: 'Générateur' },
    { to: '/seances', label: 'Séances' },
    { to: '/bibliotheque', label: 'Bibliothèque' },
  ]

  return (
    <section className="dashboard">
      <div className="dashboard__hero">
        <div>
          <p className="dashboard__eyebrow">Bienvenue</p>
          <h2 className="dashboard__title">{profile?.full_name || profile?.email || 'Membre BCVB'}</h2>
          <p className="dashboard__text">
            Vous êtes connecté à la plateforme privée du BCVB en tant que <strong>{roleLabel(profile?.role)}</strong>.
          </p>
        </div>

        <div className="dashboard__badge">{roleLabel(profile?.role)}</div>
      </div>

      <div className="dashboard__grid">
        {quickLinks.map((item) => (
          <Link key={item.to} to={item.to} className="dashboard__card">
            <span className="dashboard__cardTitle">{item.label}</span>
            <span className="dashboard__cardText">Accéder au module</span>
          </Link>
        ))}
      </div>

      <div className="dashboard__panel">
        <h3>ADN BCVB</h3>
        <ul>
          <li>Défendre Fort</li>
          <li>Courir</li>
          <li>Partager la Balle</li>
          <li>Je découvre / je m’exerce / je retranscris / je régule</li>
        </ul>
      </div>
    </section>
  )
}
