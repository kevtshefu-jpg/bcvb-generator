import { FormEvent, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setSuccessMessage(null)
    setErrorMessage(null)

    if (!email.trim()) {
      setErrorMessage("Merci de renseigner votre adresse email.")
      return
    }

    try {
      setLoading(true)

      const redirectTo = `${window.location.origin}/reinitialisation-mot-de-passe`

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      })

      if (error) {
        throw error
      }

      setSuccessMessage(
        "Si cette adresse existe dans la plateforme, un email de réinitialisation vient d’être envoyé."
      )
      setEmail('')
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erreur lors de l’envoi de l’email de réinitialisation."
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
          <h2 className="dashboard-page__title">Mot de passe oublié</h2>
          <p className="dashboard-page__text">
            Saisissez votre adresse email pour recevoir un lien de réinitialisation.
          </p>
        </div>

        <div className="dashboard-page__badge">
          <span className="dashboard-page__badgeLabel">Accès</span>
          <strong>Réinitialisation</strong>
        </div>
      </div>

      <article className="dashboard-panelCard">
        <h3 className="dashboard-panelCard__title">Recevoir un lien par email</h3>

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

        <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
          <div>
            <label className="bcvb-label" htmlFor="forgot-email">
              Adresse email
            </label>
            <input
              id="forgot-email"
              className="bcvb-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre email"
              disabled={loading}
              required
            />
          </div>

          <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="submit"
              className="bcvb-primary-btn"
              disabled={loading}
            >
              {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
            </button>
          </div>
        </form>
      </article>
    </section>
  )
}
