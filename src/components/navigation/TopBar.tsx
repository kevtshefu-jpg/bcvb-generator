import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/context/AuthContext'
import { formatRole, getRoleHomeLabel } from '../../features/auth/utils/roles'

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
        <p className="topbar__eyebrow">BCVB Référentiel</p>
        <h1 className="topbar__title">{getRoleHomeLabel(profile?.role)}</h1>
        <p className="topbar__subtitle">
          Plateforme technique, pédagogique et terrain du BCVB.
        </p>
      </div>

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
    </header>
  )
}