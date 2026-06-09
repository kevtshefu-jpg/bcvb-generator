import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'

type RecoveryStatus = 'checking' | 'ready' | 'invalid' | 'success'

function getReadableAuthError(message: string) {
  const normalizedMessage = message.toLowerCase()

  if (
    normalizedMessage.includes('expired') ||
    normalizedMessage.includes('invalid') ||
    normalizedMessage.includes('otp') ||
    normalizedMessage.includes('token')
  ) {
    return 'Le lien de réinitialisation est invalide ou expiré. Merci de refaire une demande de lien.'
  }

  if (normalizedMessage.includes('password')) {
    return 'Le mot de passe ne respecte pas les règles de sécurité demandées.'
  }

  return message || 'Une erreur est survenue pendant la réinitialisation du mot de passe.'
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<RecoveryStatus>('checking')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    return status === 'ready' && !loading
  }, [status, loading])

  useEffect(() => {
    let isMounted = true

    async function initRecoverySession() {
      setStatus('checking')
      setErrorMessage(null)
      setSuccessMessage(null)

      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')
      const hash = window.location.hash
      const hasLegacyRecoveryToken =
        hash.includes('access_token=') && hash.includes('type=recovery')

      /**
       * Cas Supabase moderne / PKCE :
       * URL du type :
       * /reinitialisation-mot-de-passe?code=xxxx
       */
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!isMounted) return

        if (error) {
          setStatus('invalid')
          setErrorMessage(getReadableAuthError(error.message))
          return
        }

        /**
         * Nettoyage de l'URL après échange du code.
         * On évite de garder ?code=... dans la barre d'adresse.
         */
        window.history.replaceState(
          {},
          document.title,
          '/reinitialisation-mot-de-passe'
        )

        setStatus('ready')
        setErrorMessage(null)
        return
      }

      /**
       * Cas Supabase ancien format :
       * URL du type :
       * /reinitialisation-mot-de-passe#access_token=...&type=recovery
       */
      if (hasLegacyRecoveryToken) {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (!isMounted) return

        if (error) {
          setStatus('invalid')
          setErrorMessage(getReadableAuthError(error.message))
          return
        }

        if (session) {
          setStatus('ready')
          setErrorMessage(null)
          return
        }
      }

      /**
       * Cas où Supabase a déjà une session active.
       * Utile si l'utilisateur revient sur la page juste après avoir cliqué le lien.
       */
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (!isMounted) return

      if (sessionError) {
        setStatus('invalid')
        setErrorMessage(getReadableAuthError(sessionError.message))
        return
      }

      if (session) {
        setStatus('ready')
        setErrorMessage(null)
        return
      }

      setStatus('invalid')
      setErrorMessage(
        'Le lien de réinitialisation est invalide, expiré ou incomplet. Merci de refaire une demande de lien.'
      )
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (!isMounted) return

      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setStatus('ready')
        setErrorMessage(null)
      }
    })

    initRecoverySession()

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setSuccessMessage(null)
    setErrorMessage(null)

    const trimmedPassword = password.trim()
    const trimmedConfirmPassword = confirmPassword.trim()

    if (!trimmedPassword || !trimmedConfirmPassword) {
      setErrorMessage('Merci de remplir les deux champs.')
      return
    }

    if (trimmedPassword.length < 8) {
      setErrorMessage('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas.')
      return
    }

    if (status !== 'ready') {
      setErrorMessage(
        'Le lien de réinitialisation n’est pas encore validé. Merci de refaire une demande de lien.'
      )
      return
    }

    try {
      setLoading(true)

      const { error } = await supabase.auth.updateUser({
        password: trimmedPassword,
      })

      if (error) {
        throw error
      }

      await supabase.auth.signOut()

      setStatus('success')
      setPassword('')
      setConfirmPassword('')
      setSuccessMessage(
        'Votre mot de passe a bien été mis à jour. Vous allez être redirigé vers la connexion.'
      )

      window.setTimeout(() => {
        navigate('/connexion', { replace: true })
      }, 1600)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? getReadableAuthError(error.message)
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
          <h2 className="dashboard-page__title">
            Définir un nouveau mot de passe
          </h2>
          <p className="dashboard-page__text">
            Choisissez un nouveau mot de passe pour accéder à votre compte BCVB.
          </p>
        </div>

        <div className="dashboard-page__badge">
          <span className="dashboard-page__badgeLabel">Accès</span>
          <strong>Réinitialisation</strong>
        </div>
      </div>

      <article className="dashboard-panelCard">
        <h3 className="dashboard-panelCard__title">Nouveau mot de passe</h3>

        {status === 'checking' && (
          <div
            style={{
              marginTop: 16,
              marginBottom: 16,
              padding: '14px 16px',
              borderRadius: 14,
              background: 'rgba(15, 23, 42, 0.06)',
              border: '1px solid rgba(15, 23, 42, 0.10)',
            }}
          >
            Vérification du lien de réinitialisation...
          </div>
        )}

        {successMessage && (
          <div
            role="status"
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
            role="alert"
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

        {status === 'invalid' && (
          <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link className="bcvb-primary-btn" to="/mot-de-passe-oublie">
              Demander un nouveau lien
            </Link>

            <Link className="bcvb-secondary-btn" to="/connexion">
              Retour à la connexion
            </Link>
          </div>
        )}

        {status === 'ready' && (
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
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Nouveau mot de passe"
                  disabled={loading}
                  autoComplete="new-password"
                  minLength={8}
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
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirmer le mot de passe"
                  disabled={loading}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
            </div>

            <div
              style={{
                marginTop: 20,
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <button
                type="submit"
                className="bcvb-primary-btn"
                disabled={!canSubmit}
              >
                {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
              </button>

              <Link className="bcvb-secondary-btn" to="/connexion">
                Retour à la connexion
              </Link>
            </div>
          </form>
        )}
      </article>
    </section>
  )
}