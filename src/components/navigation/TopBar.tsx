import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/context/AuthContext'

function formatRole(role?: string | null) {
  if (!role) return 'Membre'
  if (role === 'admin') return 'Administrateur'
  if (role === 'dirigeant') return 'Dirigeant'
  if (role === 'coach') return 'Coach'
  return 'Membre'
}

export function TopBar() {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/connexion')
  }

  return (
    <header className="topbar topbar--v33">
      <div className="topbar__left">
        <p className="topbar__eyebrow">BCVB Référentiel</p>
        <h1 className="topbar__title">Plateforme technique, pédagogique et terrain</h1>
        <p className="topbar__subtitle">
          Une base commune pour structurer le jeu, la formation et les contenus du club.
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
          <button className="topbar__logout" onClick={handleLogout}>
            Déconnexion
          </button>
        )}
      </div>
    </header>
  )
}
