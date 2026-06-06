import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '../../config/navigation'
import { PRESENTATION_LABELS } from '../../config/presentationMode'
import { useAuth } from '../../features/auth/context/AuthContext'

function linkClass({ isActive }: { isActive: boolean }) {
  return `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
}

function groupBySection<T extends { group: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    groups[item.group] = groups[item.group] ? [...groups[item.group], item] : [item]
    return groups
  }, {})
}

export function Sidebar() {
  const { user, profile } = useAuth()
  const role = profile?.role
  const visibleItems = NAV_ITEMS.filter((item) => item.visible(role))
  const groupedItems = groupBySection(visibleItems)

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <img
          src="/logo_bcvb copie.png"
          alt="Logo BCVB"
          className="sidebar__logoImage"
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
        />

        <div>
          <h1 className="sidebar__title">{PRESENTATION_LABELS.appTitle}</h1>
          <p className="sidebar__subtitle">{PRESENTATION_LABELS.appSubtitle}</p>
        </div>
      </div>

      <nav className="sidebar__nav">
        {Object.entries(groupedItems).map(([section, items]) => (
          <div className="sidebar__section" key={section}>
            <p className="sidebar__sectionTitle">{section}</p>

            <div className="sidebar__sectionLinks">
              {items.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => `${linkClass({ isActive })} sidebar__link--${item.color}`}
                  title={item.description}
                >
                  <span className="sidebar__linkIcon" aria-hidden="true">
                    {item.color === 'green' ? '●' : '◆'}
                  </span>
                  <span className="sidebar__linkText">{item.label}</span>
                  {item.adminOnly && <span className="sidebar__adminBadge">Admin</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}

        {!user && (
          <div className="sidebar__section">
            <p className="sidebar__sectionTitle">Compte</p>
            <div className="sidebar__sectionLinks">
              <NavLink to="/connexion" className={linkClass}>
                Connexion
              </NavLink>
              <NavLink to="/inscription" className={linkClass}>
                Inscription
              </NavLink>
            </div>
          </div>
        )}
      </nav>

      <div className="sidebar__footer">
        <p className="sidebar__footerTitle">Cadre BCVB</p>
        <p className="sidebar__footerText">Défendre fort • Courir • Partager la balle</p>
      </div>
    </aside>
  )
}
