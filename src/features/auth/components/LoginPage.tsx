import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function getDefaultPathByRole(role?: string | null) {
  if (role === 'admin') return '/admin'
  if (role === 'dirigeant') return '/club'
  if (role === 'coach') return '/dashboard'
  return '/dashboard'
}

export default function LoginPage() {
  const { signIn, user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname

  useEffect(() => {
    if (!loading && user && profile?.is_active) {
      navigate(from || getDefaultPathByRole(profile.role), { replace: true })
    }
  }, [loading, user, profile, navigate, from])

  if (!loading && user && profile?.is_active) {
    return <Navigate to={from || getDefaultPathByRole(profile.role)} replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const result = await signIn(email, password)

    if (result.error) {
      setError(result.error)
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

        {error && <div style={{ color: 'crimson' }}>{error}</div>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}
