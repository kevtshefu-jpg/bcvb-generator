import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/context/AuthContext'
import { formatRole, getRoleHomeLabel } from '../../features/auth/utils/roles'
import { PRESENTATION_LABELS } from '../../config/presentationMode'
import CurrentModuleContext from '../../features/studio-ux/components/CurrentModuleContext'
import { Breadcrumbs } from './Breadcrumbs'
import { PrimaryNavigation } from './PrimaryNavigation'

export function TopBar() {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await signOut()
      navigate('/connexion')
    } catch (error) {
      console.error('Erreur lors de la déconnexion :', error)
    }
  }

  return (
    <header className="topbar topbar--v33">
      <div className="topbar__left">
        <div className="topbar__brandLine">
          <img src="/logo_bcvb copie.png" alt="Logo BCVB" className="topbar__logo" />
          <div>
	            <p className="topbar__eyebrow">{PRESENTATION_LABELS.appTitle}</p>
	            <h1 className="topbar__title">{getRoleHomeLabel(profile?.role)}</h1>
	            <p className="topbar__subtitle">
	              {PRESENTATION_LABELS.appSubtitle}
	            </p>
          </div>
        </div>
      </div>

      <PrimaryNavigation role={profile?.role} />

      <div className="topbar__right">
        <div className="topbar__identityCard">
          <span className="topbar__identityLabel">Session active</span>
          <span className="topbar__name">
            {profile?.full_name || profile?.email || user?.email || 'Membre'}
          </span>
          <span className="topbar__role">{formatRole(profile?.role)}</span>
        </div>

        {user && (
          <button
            type="button"
            className="topbar__logout"
            onClick={handleLogout}
          >
            Déconnexion
          </button>
        )}
      </div>

      <Breadcrumbs role={profile?.role} />
      <CurrentModuleContext role={profile?.role} />
    </header>
  )
}
