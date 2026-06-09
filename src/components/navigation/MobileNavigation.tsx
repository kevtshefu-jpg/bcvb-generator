import { useState } from 'react'
import { NavLink } from 'react-router-dom'

type MobileNavigationItem = {
  label: string
  subtitle?: string
  to: string
  icon?: string
  adminOnly?: boolean
}

const items: MobileNavigationItem[] = [
  {
    label: 'Tableau de bord',
    subtitle: 'Consulter les raccourcis',
    to: '/',
    icon: '▦',
  },
  {
    label: 'Bibliothèque',
    subtitle: 'Ouvrir un document',
    to: '/bibliotheque',
    icon: '📗',
  },
  {
    label: 'FAQ plateforme BCVB',
    subtitle: 'Rechercher une réponse',
    to: '/faq',
    icon: '❔',
  },
  {
    label: 'Connexion',
    subtitle: 'Accéder à votre espace',
    to: '/connexion',
    icon: '👤',
  },
  {
    label: 'Inscription',
    subtitle: 'Créer un accès',
    to: '/inscription',
    icon: '🛡️',
  },
  {
    label: 'Paramètres',
    subtitle: 'Administration',
    to: '/admin',
    icon: '⚙️',
    adminOnly: true,
  },
]

export default function MobileNavigation() {
  const [open, setOpen] = useState(false)

  function closeMenu() {
    setOpen(false)
  }

  return (
    <>
      <header className="mobile-nav">
        <div className="mobile-nav__brand">
          <div className="mobile-nav__logo">BCVB</div>
          <div>
            <p>BCVB Référentiel</p>
            <strong>Plateforme club</strong>
          </div>
        </div>

        <button
          type="button"
          className="mobile-nav__button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-navigation-panel"
        >
          {open ? 'Fermer' : 'Menu'}
        </button>
      </header>

      {open && (
        <div
          id="mobile-navigation-panel"
          className="mobile-nav-panel"
        >
          <div className="mobile-nav-panel__content">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMenu}
                className={({ isActive }) =>
                  isActive
                    ? 'mobile-nav-panel__link mobile-nav-panel__link--active'
                    : 'mobile-nav-panel__link'
                }
              >
                <span className="mobile-nav-panel__icon">{item.icon}</span>

                <span className="mobile-nav-panel__text">
                  <strong>{item.label}</strong>
                  {item.subtitle ? <small>{item.subtitle}</small> : null}
                </span>

                {item.adminOnly ? (
                  <span className="mobile-nav-panel__badge">ADMIN</span>
                ) : null}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </>
  )
}