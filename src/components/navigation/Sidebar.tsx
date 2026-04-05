import { NavLink } from 'react-router-dom'
import { useAuth } from '../../features/auth/context/AuthContext'

type LinkItem = {
  to: string
  label: string
}

type Section = {
  title: string
  links: LinkItem[]
}

export function Sidebar() {
  const { user, profile } = useAuth()

  if (!user || !profile?.is_active) {
    return (
      <aside className="sidebar">
        <div className="sidebar__brand">
          <img src="/logo_bcvb copie.png" alt="BCVB" className="sidebar__logoImage" />
          <div>
            <p className="sidebar__title">BCVB Platform</p>
            <p className="sidebar__subtitle">Membres</p>
          </div>
        </div>

        <nav className="sidebar__nav">
          <NavLink to="/" end className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}>
            Accueil
          </NavLink>
          <NavLink to="/connexion" className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}>
            Connexion
          </NavLink>
        </nav>
      </aside>
    )
  }

  const sections: Section[] = [
    {
      title: 'Général',
      links: [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/bibliotheque', label: 'Bibliothèque' },
      ],
    },
  ]

  if (profile.role === 'coach' || profile.role === 'admin') {
    sections.push({
      title: 'Référentiel',
      links: [
        { to: '/categories', label: 'Catégories' },
        { to: '/themes', label: 'Thèmes' },
        { to: '/situations', label: 'Situations' },
      ],
    })

    sections.push({
      title: 'Production',
      links: [
        { to: '/generateur', label: 'Générateur' },
        { to: '/seances', label: 'Séances' },
      ],
    })
  }

  if (profile.role === 'dirigeant' || profile.role === 'admin') {
    sections.push({
      title: 'Structure',
      links: [{ to: '/club', label: 'Club' }],
    })
  }

  if (profile.role === 'admin') {
    sections.push({
      title: 'Pilotage',
      links: [{ to: '/admin', label: 'Admin' }],
    })
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <img src="/logo_bcvb copie.png" alt="BCVB" className="sidebar__logoImage" />
        <div>
          <p className="sidebar__title">BCVB Platform</p>
          <p className="sidebar__subtitle">Membres</p>
        </div>
      </div>

      <nav className="sidebar__nav">
        {sections.map((section) => (
          <div key={section.title} className="sidebar__section">
            <p className="sidebar__sectionTitle">{section.title}</p>
            <div className="sidebar__sectionLinks">
              {section.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
