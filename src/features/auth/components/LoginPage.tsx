import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { formatUserFacingError } from '../../../lib/userFacingError'
import { ACCESS_SUSPENDED_MESSAGE, isProfileAllowed } from '../utils/profileAccess'

function getDefaultPathByRole(role?: string | null) {
  if (role === 'admin' || role === 'responsable_technique') return '/admin'
  if (role === 'dirigeant') return '/club'
  if (role === 'coach') return '/dashboard'
  return '/dashboard'
}

export default function LoginPage() {
  const { signIn, signOut, user, profile, loading, profileError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname

  useEffect(() => {
    if (!loading && user && isProfileAllowed(profile)) {
      navigate(from || getDefaultPathByRole(profile.role), { replace: true })
    }
  }, [loading, user, profile, navigate, from])

  if (!loading && user && isProfileAllowed(profile)) {
    return <Navigate to={from || getDefaultPathByRole(profile.role)} replace />
  }

  if (!loading && user && (profileError || !isProfileAllowed(profile))) {
    return (
      <main className="bcvb-page-loading" role="alert">
        <div className="bcvb-loading-card">
          <p className="bcvb-eyebrow">Accès suspendu</p>
          <h1>Profil non vérifié</h1>
          <p>{ACCESS_SUSPENDED_MESSAGE}</p>
          <button type="button" className="bcvb-button" onClick={() => void signOut()}>
            Se déconnecter
          </button>
        </div>
      </main>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const result = await signIn(email, password)

    if (result.error) {
      setError(formatUserFacingError(result.error, 'Connexion impossible. Vérifie ton email, ton mot de passe ou demande un nouveau lien d’accès.'))
      setSubmitting(false)
      return
    }

    setSubmitting(false)
  }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: 24 }}>
      <h1>Connexion membre</h1>
      <p>Accès réservé aux membres autorisés du BCVB.</p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <input
          type="email"
          placeholder="Adresse email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <div role="alert" style={{ color: 'crimson', lineHeight: 1.45 }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <div style={{ marginTop: 16 }}>
        <Link to="/mot-de-passe-oublie" className="dashboard-inlineLink">
          Mot de passe oublié ?
        </Link>
      </div>
    </div>
  )
}
