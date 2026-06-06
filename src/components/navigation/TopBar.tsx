import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/context/AuthContext'
import { formatRole, getRoleHomeLabel } from '../../features/auth/utils/roles'
import { PRESENTATION_LABELS } from '../../config/presentationMode'
import CurrentModuleContext from '../../features/studio-ux/components/CurrentModuleContext'
import { Breadcrumbs } from './Breadcrumbs'
import { PrimaryNavigation } from './PrimaryNavigation'

function getRoleIcon(role?: string | null): string {
  switch (role) {
    case 'admin':
      return '⚙️'
    case 'coach':
      return '🎯'
    case 'dirigeant':
      return '👔'
    case 'parent_referent':
      return '👥'
    case 'team_staff':
      return '👷'
    default:
      return '📖'
  }
}

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
  <>
    <header className="topbar topbar--v33" role="banner">
      <div className="topbar__left">
        <div className="topbar__brandLine">
          <img
            src="/logo_bcvb copie.png"
            alt="Logo BCVB"
            className="topbar__logo"
          />

          <div className="topbar__brandText">
            <p className="topbar__eyebrow">
              {PRESENTATION_LABELS.appTitle}
            </p>

            <h1 className="topbar__title">
              Studio documentaire BCVB
            </h1>

            <p className="topbar__subtitle">
              {getRoleHomeLabel(profile?.role)} · {PRESENTATION_LABELS.appSubtitle}
            </p>
          </div>
        </div>
      </div>

      <PrimaryNavigation role={profile?.role} />

      <div className="topbar__right" aria-label="Informations utilisateur">
        <div className="topbar__identityCard">
          <span className="topbar__identityLabel">Session active</span>

          <span className="topbar__name">
            {profile?.full_name || profile?.email || user?.email || 'Membre'}
          </span>

          <span className="topbar__role">
            <span className="topbar__roleIcon" aria-hidden="true">
              {getRoleIcon(profile?.role)}
            </span>
            {formatRole(profile?.role)}
          </span>
        </div>

        {user && (
          <button
            type="button"
            className="topbar__logout"
            onClick={handleLogout}
            aria-label="Se déconnecter du Studio documentaire BCVB"
          >
            Déconnexion
          </button>
        )}
      </div>
    </header>

    <div className="topbar-context" aria-label="Contexte de navigation">
      <Breadcrumbs role={profile?.role} />
      <CurrentModuleContext role={profile?.role} />
    </div>
  </>
)
}
