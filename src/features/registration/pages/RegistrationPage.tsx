import { useState } from 'react'
import { createRegistrationRequest } from '../services/registrationService'

type FormState = {
  first_name: string
  last_name: string
  email: string
  phone: string
  birth_year: string
  category_requested: string
  role_requested: string
  notes: string
}

const initialState: FormState = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  birth_year: '',
  category_requested: '',
  role_requested: 'joueur',
  notes: '',
}

const categoryOptions = [
  'U7',
  'U9',
  'U11',
  'U13',
  'U15',
  'U18',
  'Seniors',
]

export default function RegistrationPage() {
  const [form, setForm] = useState<FormState>(initialState)
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      setLoading(true)
      setSuccessMessage(null)
      setErrorMessage(null)

      await createRegistrationRequest({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        birth_year: form.birth_year ? Number(form.birth_year) : undefined,
        category_requested: form.category_requested,
        role_requested: form.role_requested,
        notes: form.notes.trim() || undefined,
      })

      setSuccessMessage(
        "Votre demande d'inscription a bien été envoyée. Elle sera étudiée par le BCVB."
      )
      setForm(initialState)
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Erreur lors de l'envoi de la demande"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-page__hero">
        <div>
          <p className="dashboard-page__eyebrow">BCVB</p>
          <h2 className="dashboard-page__title">Demande d’inscription</h2>
          <p className="dashboard-page__text">
            Remplissez ce formulaire pour envoyer une demande d’inscription au club.
            Un responsable reviendra vers vous après étude.
          </p>
        </div>

        <div className="dashboard-page__badge">
          <span className="dashboard-page__badgeLabel">Statut</span>
          <strong>Visiteur</strong>
        </div>
      </div>

      <article className="dashboard-panelCard">
        <h3 className="dashboard-panelCard__title">Informations du demandeur</h3>

        <form onSubmit={handleSubmit} className="bcvb-form-stack" style={{ marginTop: 16 }}>
          <div className="bcvb-form-grid">
            <label className="bcvb-label-block">
              <span>Prénom</span>
              <input
                className="bcvb-input"
                value={form.first_name}
                onChange={(e) => updateField('first_name', e.target.value)}
                required
              />
            </label>

            <label className="bcvb-label-block">
              <span>Nom</span>
              <input
                className="bcvb-input"
                value={form.last_name}
                onChange={(e) => updateField('last_name', e.target.value)}
                required
              />
            </label>
          </div>

          <div className="bcvb-form-grid">
            <label className="bcvb-label-block">
              <span>Email</span>
              <input
                className="bcvb-input"
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                required
              />
            </label>

            <label className="bcvb-label-block">
              <span>Téléphone</span>
              <input
                className="bcvb-input"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
              />
            </label>
          </div>

          <div className="bcvb-form-grid">
            <label className="bcvb-label-block">
              <span>Année de naissance</span>
              <input
                className="bcvb-input"
                type="number"
                value={form.birth_year}
                onChange={(e) => updateField('birth_year', e.target.value)}
              />
            </label>

            <label className="bcvb-label-block">
              <span>Catégorie demandée</span>
              <select
                className="bcvb-input"
                value={form.category_requested}
                onChange={(e) => updateField('category_requested', e.target.value)}
                required
              >
                <option value="">Choisir une catégorie</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="bcvb-form-grid">
            <label className="bcvb-label-block">
              <span>Type de demande</span>
              <select
                className="bcvb-input"
                value={form.role_requested}
                onChange={(e) => updateField('role_requested', e.target.value)}
              >
                <option value="joueur">Joueur / joueuse</option>
                <option value="parent">Parent</option>
              </select>
            </label>

            <div />
          </div>

          <label className="bcvb-label-block">
            <span>Informations complémentaires</span>
            <textarea
              className="bcvb-textarea"
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
            />
          </label>

          {successMessage && (
            <div className="info-banner" style={{ borderColor: '#b7e4c7' }}>
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="info-banner" style={{ borderColor: '#f5c2c7' }}>
              {errorMessage}
            </div>
          )}

          <div>
            <button className="bcvb-primary-btn" type="submit" disabled={loading}>
              {loading ? 'Envoi en cours...' : "Envoyer la demande d'inscription"}
            </button>
          </div>
        </form>
      </article>
    </section>
  )
}