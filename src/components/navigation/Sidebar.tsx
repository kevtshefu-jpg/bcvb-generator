











import { NavLink } from 'react-router-dom'
import { useAuth } from '../../features/auth/context/AuthContext'

function linkClass({ isActive }: { isActive: boolean }) {
  return `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
}

export function Sidebar() {
  const { user, profile } = useAuth()

  const isAdmin = profile?.role === 'admin'
  const isDirigeant = profile?.role === 'dirigeant'

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <img
          src="/logo-bcvb.png"
          alt="Logo BCVB"
          className="sidebar__logoImage"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
        />
        <div>
          <h1 className="sidebar__title">BCVB Référentiel</h1>
          <p className="sidebar__subtitle">Plateforme technique, pédagogique et terrain</p>
        </div>
      </div>

      <nav className="sidebar__nav">
        <div className="sidebar__section">
          <p className="sidebar__sectionTitle">Général</p>
          <div className="sidebar__sectionLinks">
            <NavLink to="/" end className={linkClass}>
              Accueil
            </NavLink>

            {!user ? (
              <NavLink to="/connexion" className={linkClass}>
                Connexion
              </NavLink>
            ) : (
              <>
                <NavLink to="/dashboard" className={linkClass}>
                  Tableau de bord
                </NavLink>
                <NavLink to="/bibliotheque" className={linkClass}>
                  Bibliothèque
                </NavLink>
              </>
            )}
          </div>
        </div>

        {user && (
          <>
            <div className="sidebar__section">
              <p className="sidebar__sectionTitle">Référentiel</p>
              <div className="sidebar__sectionLinks">
                <NavLink to="/categories" className={linkClass}>
                  Catégories
                </NavLink>
                <NavLink to="/themes" className={linkClass}>
                  Thèmes
                </NavLink>
                <NavLink to="/situations" className={linkClass}>
                  Situations
                </NavLink>
              </div>
            </div>

            <div className="sidebar__section">
              <p className="sidebar__sectionTitle">Production</p>
              <div className="sidebar__sectionLinks">
                <NavLink to="/generateur" className={linkClass}>
                  Générateur
                </NavLink>
                <NavLink to="/seances" className={linkClass}>
                  Séances
                </NavLink>
              </div>
            </div>

            {(isAdmin || isDirigeant) && (
              <div className="sidebar__section">
                <p className="sidebar__sectionTitle">Pilotage</p>
                <div className="sidebar__sectionLinks">
                  <NavLink to="/club" className={linkClass}>
                    Club
                  </NavLink>
                  {isAdmin && (
                    <NavLink to="/admin" className={linkClass}>
                      Administration
                    </NavLink>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </nav>

      <div className="sidebar__footer">
        <p className="sidebar__footerTitle">Identité BCVB</p>
        <p className="sidebar__footerText">Défendre fort • Courir • Partager la balle</p>
      </div>
    </aside>
  )
}
