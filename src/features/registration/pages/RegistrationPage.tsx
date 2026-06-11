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
  requested_team: string
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
  requested_team: '',
  notes: '',
}

const categoryOptions = [
  'U7',
  'U9',
  'U11',
  'U13',
  'U15',
  'U18',
  'U21',
  'Seniors',
  'Loisirs',
  'Dirigeants',
  'Bénévoles',
  'Non défini',
]

const roleOptions = [
  { value: 'joueur', label: 'Joueur / joueuse' },
  { value: 'parent', label: 'Parent' },
  { value: 'parent_referent', label: 'Parent référent' },
  { value: 'team_staff', label: 'Staff équipe' },
  { value: 'coach', label: 'Coach' },
  { value: 'aide_coach', label: 'Aide coach' },
  { value: 'dirigeant', label: 'Dirigeant' },
  { value: 'benevole', label: 'Bénévole' },
  { value: 'commission_animation', label: 'Commission animation' },
  { value: 'arbitre', label: 'Arbitre' },
  { value: 'otm', label: 'OTM / table de marque' },
  { value: 'member', label: 'Membre / autre' },
]

function normalizeText(value: string) {
  return value.trim()
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function getFullName(form: RegistrationFormState) {
  return `${normalizeText(form.first_name)} ${normalizeText(form.last_name)}`.trim()
}

function getBirthYearError(value: string) {
  const parsedYear = Number(value)
  const currentYear = new Date().getFullYear()

  if (!value.trim()) {
    return 'Merci de renseigner l’année de naissance.'
  }

  if (!Number.isInteger(parsedYear)) {
    return "L’année de naissance n’est pas valide."
  }

  if (parsedYear < 1940 || parsedYear > currentYear - 3) {
    return "L’année de naissance semble incorrecte."
  }

  return null
}

export default function RegistrationPage() {
  const [form, setForm] = useState<RegistrationFormState>(initialForm)
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fullName = useMemo(() => getFullName(form), [form])

  const canSubmit = useMemo(() => {
    return (
      normalizeText(form.first_name) !== '' &&
      normalizeText(form.last_name) !== '' &&
      normalizeEmail(form.email) !== '' &&
      normalizeText(form.birth_year) !== '' &&
      normalizeText(form.category_requested) !== '' &&
      normalizeText(form.role_requested) !== ''
    )
  }, [form])

  function updateField<K extends keyof RegistrationFormState>(
    key: K,
    value: RegistrationFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function createLegacyRegistrationRequest(payload: {
    first_name: string
    last_name: string
    email: string
    phone: string | null
    birth_year: number
    category_requested: string
    role_requested: string
    requested_team: string | null
    notes: string | null
    status: string
  }) {
    const { error } = await supabase
      .from('registration_requests')
      .insert([payload])

    if (error) {
      throw new Error(error.message)
    }
  }

  async function createAdminProfileRequest(payload: {
    email: string
    full_name: string
    requested_role: string
    requested_category_id: string
    requested_team: string | null
    phone: string | null
    motivation: string | null
    message: string | null
  }) {
    const { error } = await supabase
      .from('profile_requests')
      .insert([
        {
          user_id: null,
          email: payload.email,
          full_name: payload.full_name,
          requested_role: payload.requested_role,
          requested_category_id: payload.requested_category_id,
          requested_team: payload.requested_team,
          phone: payload.phone,
          motivation: payload.motivation,
          message: payload.message,
          status: 'pending',
        },
      ])

    if (error) {
      throw new Error(error.message)
    }
  }

  async function notifyAdminByEmail(payload: {
    fullName: string
    email: string
    requestedRole: string
    requestedCategoryId: string
    requestedTeam: string | null
    phone: string | null
    message: string | null
  }) {
    const { error } = await supabase.functions.invoke('notify-profile-request', {
      body: payload,
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setSuccessMessage(null)
    setErrorMessage(null)

    if (!canSubmit) {
      setErrorMessage('Merci de compléter les champs obligatoires.')
      return
    }

    const trimmedFirstName = normalizeText(form.first_name)
    const trimmedLastName = normalizeText(form.last_name)
    const trimmedEmail = normalizeEmail(form.email)
    const trimmedPhone = normalizeText(form.phone)
    const trimmedNotes = normalizeText(form.notes)
    const trimmedTeam = normalizeText(form.requested_team)
    const trimmedCategory = normalizeText(form.category_requested)
    const trimmedRole = normalizeText(form.role_requested)

    if (!isValidEmail(trimmedEmail)) {
      setErrorMessage('Merci de renseigner une adresse email valide.')
      return
    }

    const birthYearError = getBirthYearError(form.birth_year)

    if (birthYearError) {
      setErrorMessage(birthYearError)
      return
    }

    const parsedBirthYear = Number(form.birth_year)
    const finalFullName = `${trimmedFirstName} ${trimmedLastName}`.trim()

    try {
      setLoading(true)

      const legacyPayload = {
        first_name: trimmedFirstName,
        last_name: trimmedLastName,
        email: trimmedEmail,
        phone: trimmedPhone || null,
        birth_year: parsedBirthYear,
        category_requested: trimmedCategory,
        role_requested: trimmedRole,
        requested_team: trimmedTeam || null,
        notes: trimmedNotes || null,
        status: 'pending',
      }

      await createLegacyRegistrationRequest(legacyPayload)

      await createAdminProfileRequest({
        email: trimmedEmail,
        full_name: finalFullName,
        requested_role: trimmedRole,
        requested_category_id: trimmedCategory,
        requested_team: trimmedTeam || null,
        phone: trimmedPhone || null,
        motivation: trimmedNotes || null,
        message: trimmedNotes || null,
      })

      try {
        await notifyAdminByEmail({
          fullName: finalFullName,
          email: trimmedEmail,
          requestedRole: trimmedRole,
          requestedCategoryId: trimmedCategory,
          requestedTeam: trimmedTeam || null,
          phone: trimmedPhone || null,
          message: trimmedNotes || null,
        })
      } catch (notificationError) {
        console.warn('Notification email admin non envoyée :', notificationError)
      }

      setSuccessMessage(
        "Votre demande d'inscription a bien été envoyée. Un responsable du BCVB va l'étudier et valider ou non votre accès à la plateforme.",
      )

      setForm(initialForm)
    } catch (error) {
      console.error('Erreur inscription :', error)

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'envoi de la demande.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="dashboard-page registration-page">
      <div className="dashboard-page__hero">
        <div>
          <p className="dashboard-page__eyebrow">BCVB</p>
          <h2 className="dashboard-page__title">Demande d’inscription</h2>
          <p className="dashboard-page__text">
            Remplissez ce formulaire pour demander un accès au club et à la plateforme.
            Votre demande sera étudiée par un responsable avant validation.
          </p>
        </div>

        <div className="dashboard-page__badge">
          <span className="dashboard-page__badgeLabel">Statut</span>
          <strong>Visiteur</strong>
        </div>
      </div>

      <article className="dashboard-panelCard">
        <div className="registration-page__header">
          <div>
            <p className="bcvb-eyebrow">Formulaire</p>
            <h3 className="dashboard-panelCard__title">
              Informations du demandeur
            </h3>
          </div>

          <span className="registration-page__required">
            Champs obligatoires *
          </span>
        </div>

        {successMessage ? (
          <div className="registration-page__message registration-page__message--success">
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="registration-page__message registration-page__message--error">
            {errorMessage}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="registration-form__grid">
            <div>
              <label className="bcvb-label" htmlFor="first_name">
                Prénom *
              </label>
              <input
                id="first_name"
                className="bcvb-input"
                type="text"
                value={form.first_name}
                onChange={(event) => updateField('first_name', event.target.value)}
                placeholder="Prénom"
                disabled={loading}
                autoComplete="given-name"
                required
              />
            </div>

            <div>
              <label className="bcvb-label" htmlFor="last_name">
                Nom *
              </label>
              <input
                id="last_name"
                className="bcvb-input"
                type="text"
                value={form.last_name}
                onChange={(event) => updateField('last_name', event.target.value)}
                placeholder="Nom"
                disabled={loading}
                autoComplete="family-name"
                required
              />
            </div>

            <div>
              <label className="bcvb-label" htmlFor="email">
                Email *
              </label>
              <input
                id="email"
                className="bcvb-input"
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="exemple@email.fr"
                disabled={loading}
                autoComplete="email"
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
                type="tel"
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                placeholder="06..."
                disabled={loading}
                autoComplete="tel"
              />
            </div>

            <div>
              <label className="bcvb-label" htmlFor="birth_year">
                Année de naissance *
              </label>
              <input
                id="birth_year"
                className="bcvb-input"
                type="number"
                inputMode="numeric"
                min="1940"
                max={new Date().getFullYear() - 3}
                value={form.birth_year}
                onChange={(event) => updateField('birth_year', event.target.value)}
                placeholder="Ex : 2012"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="bcvb-label" htmlFor="category_requested">
                Catégorie demandée *
              </label>
              <select
                id="category_requested"
                className="bcvb-input"
                value={form.category_requested}
                onChange={(event) => updateField('category_requested', event.target.value)}
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

            <div>
              <label className="bcvb-label" htmlFor="role_requested">
                Type de demande *
              </label>
              <select
                id="role_requested"
                className="bcvb-input"
                value={form.role_requested}
                onChange={(event) => updateField('role_requested', event.target.value)}
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

            <div>
              <label className="bcvb-label" htmlFor="requested_team">
                Équipe / groupe concerné
              </label>
              <input
                id="requested_team"
                className="bcvb-input"
                type="text"
                value={form.requested_team}
                onChange={(event) => updateField('requested_team', event.target.value)}
                placeholder="Ex : U15M, SF1, U11F, bénévolat..."
                disabled={loading}
              />
            </div>

            <div className="registration-form__full">
              <label className="bcvb-label" htmlFor="notes">
                Informations complémentaires
              </label>
              <textarea
                id="notes"
                className="bcvb-input"
                value={form.notes}
                onChange={(event) => updateField('notes', event.target.value)}
                placeholder="Précisez ici toute information utile : expérience, situation, lien avec un licencié, rôle souhaité, disponibilité..."
                disabled={loading}
                rows={5}
              />
            </div>
          </div>

          <div className="registration-form__summary">
            <strong>Demande préparée</strong>
            <p>
              {fullName || 'Nom du demandeur'} · {form.role_requested || 'rôle'} ·{' '}
              {form.category_requested || 'catégorie à choisir'}
            </p>
          </div>

          <div className="registration-form__actions">
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