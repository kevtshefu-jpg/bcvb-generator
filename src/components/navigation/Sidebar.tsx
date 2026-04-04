import { NavLink } from 'react-router-dom'
import { useAuth } from '../../features/auth/context/AuthContext'

type NavItem = {
  to: string
  label: string
}

export function Sidebar() {
  const { user, profile, signOut } = useAuth()

  const publicLinks: NavItem[] = [
    { to: '/', label: 'Accueil' },
    { to: '/connexion', label: 'Connexion' }
  ]

  const memberLinks: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/bibliotheque', label: 'Bibliotheque' }
  ]

  const coachLinks: NavItem[] = [
    { to: '/categories', label: 'Categories' },
    { to: '/themes', label: 'Themes' },
    { to: '/situations', label: 'Banque de situations' },
    { to: '/generateur', label: 'Generateur' }
  ]

  const dirigeantLinks: NavItem[] = [{ to: '/club', label: 'Club' }]
  const adminLinks: NavItem[] = [{ to: '/admin', label: 'Admin' }]

  let links = publicLinks
  if (user && profile?.is_active) {
    links = [...memberLinks]

    if (profile.role === 'coach' || profile.role === 'admin') {
      links.push(...coachLinks)
    }

    if (profile.role === 'dirigeant' || profile.role === 'admin') {
      links.push(...dirigeantLinks)
    }

    if (profile.role === 'admin') {
      links.push(...adminLinks)
    }
  }

  return (
    <aside className="public-sidebar">
      <div className="public-sidebar__brand">
        <img src="/logo_bcvb copie.png" alt="BCVB" className="public-sidebar__logo" />
        <div>
          <div className="public-sidebar__title">BCVB Platform</div>
          <div className="public-sidebar__subtitle">Espace membre securise</div>
        </div>
      </div>

      <nav className="public-sidebar__nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              isActive ? "public-sidebar__link is-active" : "public-sidebar__link"
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {user && profile?.is_active ? (
        <button type="button" className="secondary-button wide" onClick={() => signOut()}>
          Déconnexion
        </button>
      ) : null}

      <div className="public-sidebar__footer">
        <div className="public-sidebar__quote">Defendre fort · Courir · Partager la balle</div>
        <div className="public-sidebar__note">Accueil public minimal, contenu prive reserve.</div>
      </div>
    </aside>
  )
}
