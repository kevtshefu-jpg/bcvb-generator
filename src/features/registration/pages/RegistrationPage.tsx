import { FormEvent, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type RegistrationFormState = {
  first_name: string
  last_name: string
  email: string
  phone: string
  birth_year: string
  category_requested: string
  role_requested: string
  notes: string
}

const initialForm: RegistrationFormState = {
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

const roleOptions = [
  { value: 'joueur', label: 'Joueur / joueuse' },
  { value: 'parent', label: 'Parent' },
  { value: 'coach', label: 'Coach' },
  { value: 'dirigeant', label: 'Dirigeant' },
]

export default function RegistrationPage() {
  const [form, setForm] = useState<RegistrationFormState>(initialForm)
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    return (
      form.first_name.trim() !== '' &&
      form.last_name.trim() !== '' &&
      form.email.trim() !== '' &&
      form.birth_year.trim() !== '' &&
      form.category_requested.trim() !== '' &&
      form.role_requested.trim() !== ''
    )
  }, [form])

  function updateField<K extends keyof RegistrationFormState>(
    key: K,
    value: RegistrationFormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setSuccessMessage(null)
    setErrorMessage(null)

    if (!canSubmit) {
      setErrorMessage('Merci de compléter les champs obligatoires.')
      return
    }

    const parsedBirthYear = Number(form.birth_year)

    if (Number.isNaN(parsedBirthYear)) {
      setErrorMessage("L'année de naissance n'est pas valide.")
      return
    }

    try {
      setLoading(true)

      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
        birth_year: parsedBirthYear,
        category_requested: form.category_requested,
        role_requested: form.role_requested,
        notes: form.notes.trim() || null,
        status: 'pending',
      }

      const { error } = await supabase
        .from('registration_requests')
        .insert([payload])

      if (error) {
        console.error('ERREUR SUPABASE :', error)
        throw error
      }

      setSuccessMessage(
        "Votre demande d'inscription a bien été envoyée. Un responsable reviendra vers vous après étude."
      )
      setForm(initialForm)
    } catch (error) {
      console.error('Erreur inscription :', error)
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'envoi de la demande"
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 16,
            }}
          >
            <div>
              <label className="bcvb-label" htmlFor="first_name">
                Prénom
              </label>
              <input
                id="first_name"
                className="bcvb-input"
                type="text"
                value={form.first_name}
                onChange={(e) => updateField('first_name', e.target.value)}
                placeholder="Prénom"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="bcvb-label" htmlFor="last_name">
                Nom
              </label>
              <input
                id="last_name"
                className="bcvb-input"
                type="text"
                value={form.last_name}
                onChange={(e) => updateField('last_name', e.target.value)}
                placeholder="Nom"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="bcvb-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className="bcvb-input"
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="Email"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="bcvb-label" htmlFor="phone">
                Téléphone
              </label>
              <input
                id="phone"
                className="bcvb-input"
                type="text"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="Téléphone"
                disabled={loading}
              />
            </div>

            <div>
              <label className="bcvb-label" htmlFor="birth_year">
                Année de naissance
              </label>
              <input
                id="birth_year"
                className="bcvb-input"
                type="number"
                inputMode="numeric"
                value={form.birth_year}
                onChange={(e) => updateField('birth_year', e.target.value)}
                placeholder="Ex : 2012"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="bcvb-label" htmlFor="category_requested">
                Catégorie demandée
              </label>
              <select
                id="category_requested"
                className="bcvb-input"
                value={form.category_requested}
                onChange={(e) => updateField('category_requested', e.target.value)}
                disabled={loading}
                required
              >
                <option value="">Choisir une catégorie</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="bcvb-label" htmlFor="role_requested">
                Type de demande
              </label>
              <select
                id="role_requested"
                className="bcvb-input"
                value={form.role_requested}
                onChange={(e) => updateField('role_requested', e.target.value)}
                disabled={loading}
                required
              >
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="bcvb-label" htmlFor="notes">
                Informations complémentaires
              </label>
              <textarea
                id="notes"
                className="bcvb-input"
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Précisez ici toute information utile."
                disabled={loading}
                rows={5}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="submit"
              className="bcvb-primary-btn"
              disabled={loading || !canSubmit}
            >
              {loading ? 'Envoi en cours...' : "Envoyer la demande d'inscription"}
            </button>

            <button
              type="button"
              className="bcvb-btn"
              disabled={loading}
              onClick={() => {
                setForm(initialForm)
                setSuccessMessage(null)
                setErrorMessage(null)
              }}
            >
              Réinitialiser
            </button>
          </div>
        </form>
      </article>
    </section>
  )
}