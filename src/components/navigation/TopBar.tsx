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
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/connexion')
  }

  return (
    <header className="topbar">
      <div className="topbar__left">
        <p className="topbar__eyebrow">BCVB Platform</p>
        <h1 className="topbar__title">Espace membres</h1>
      </div>

      <div className="topbar__right">
        <div className="topbar__identity">
          <span className="topbar__name">{profile?.full_name || profile?.email || 'Membre'}</span>
          <span className="topbar__role">{formatRole(profile?.role)}</span>
        </div>

        <button className="topbar__logout" onClick={handleLogout}>
          Déconnexion
        </button>
      </div>
    </header>
  )
}
