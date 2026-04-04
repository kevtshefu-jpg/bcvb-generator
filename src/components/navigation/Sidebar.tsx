import { NavLink } from 'react-router-dom'
import { useAuth } from '../../features/auth/context/AuthContext'

type LinkItem = {
  to: string
  label: string
}

export function Sidebar() {
  const { user, profile } = useAuth()

  const publicLinks: LinkItem[] = [
    { to: '/', label: 'Accueil' },
    { to: '/connexion', label: 'Connexion' },
  ]

  const memberLinks: LinkItem[] = [{ to: '/dashboard', label: 'Dashboard' }, { to: '/bibliotheque', label: 'Bibliothèque' }]

  const coachLinks: LinkItem[] = [
    { to: '/categories', label: 'Catégories' },
    { to: '/themes', label: 'Thèmes' },
    { to: '/situations', label: 'Situations' },
    { to: '/generateur', label: 'Générateur' },
    { to: '/seances', label: 'Séances' },
  ]

  const dirigeantLinks: LinkItem[] = [{ to: '/club', label: 'Club' }]

  const adminLinks: LinkItem[] = [{ to: '/admin', label: 'Admin' }]

  let links: LinkItem[] = [...publicLinks]

  if (user && profile?.is_active) {
    links = [...memberLinks]

    if (profile.role === 'coach' || profile.role === 'admin') {
      links = [...links, ...coachLinks]
    }

    if (profile.role === 'dirigeant' || profile.role === 'admin') {
      links = [...links, ...dirigeantLinks]
    }

    if (profile.role === 'admin') {
      links = [...links, ...adminLinks]
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo">BCVB</div>
        <div>
          <p className="sidebar__title">BCVB Platform</p>
          <p className="sidebar__subtitle">Membres</p>
        </div>
      </div>

      <nav className="sidebar__nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
