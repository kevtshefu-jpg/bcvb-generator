import { FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'

export default function ResetPasswordPage() {
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return

      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
        setErrorMessage(null)
      }
    })

    const hash = window.location.hash
    const hasRecoveryToken =
      hash.includes('access_token=') && hash.includes('type=recovery')

    if (hasRecoveryToken) {
      setReady(true)
      setErrorMessage(null)
    } else {
      setErrorMessage(
        "Le lien de réinitialisation est invalide ou incomplet. Merci de recommencer la procédure."
      )
    }

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setSuccessMessage(null)
    setErrorMessage(null)

    if (!password || !confirmPassword) {
      setErrorMessage('Merci de remplir les deux champs.')
      return
    }

    if (password.length < 8) {
      setErrorMessage('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas.')
      return
    }

    try {
      setLoading(true)

      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        throw error
      }

      setSuccessMessage('Votre mot de passe a bien été mis à jour.')

      setTimeout(() => {
        navigate('/connexion')
      }, 1500)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Erreur lors de la mise à jour du mot de passe.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-page__hero">
        <div>
          <p className="dashboard-page__eyebrow">Authentification</p>
          <h2 className="dashboard-page__title">Définir un nouveau mot de passe</h2>
          <p className="dashboard-page__text">
            Choisissez un nouveau mot de passe pour accéder à votre compte.
          </p>
        </div>

        <div className="dashboard-page__badge">
          <span className="dashboard-page__badgeLabel">Accès</span>
          <strong>Réinitialisation</strong>
        </div>
      </div>

      <article className="dashboard-panelCard">
        <h3 className="dashboard-panelCard__title">Nouveau mot de passe</h3>

        {successMessage && (
          <div
            style={{
              marginTop: 16,
              marginBottom: 16,
              padding: '14px 16px',
              borderRadius: 14,
              background: 'rgba(27, 107, 58, 0.10)',
              border: '1px solid rgba(27, 107, 58, 0.18)',
            }}
          >
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              marginTop: 16,
              marginBottom: 16,
              padding: '14px 16px',
              borderRadius: 14,
              background: 'rgba(200, 16, 46, 0.10)',
              border: '1px solid rgba(200, 16, 46, 0.18)',
            }}
          >
            {errorMessage}
          </div>
        )}

        {ready && (
          <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label className="bcvb-label" htmlFor="new-password">
                  Nouveau mot de passe
                </label>
                <input
                  id="new-password"
                  className="bcvb-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nouveau mot de passe"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="bcvb-label" htmlFor="confirm-password">
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirm-password"
                  className="bcvb-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmer le mot de passe"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="submit"
                className="bcvb-primary-btn"
                disabled={loading}
              >
                {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
              </button>
            </div>
          </form>
        )}
      </article>
    </section>
  )
}