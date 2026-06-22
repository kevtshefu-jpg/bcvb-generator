import { FormEvent, useMemo, useState } from 'react'

import RegistrationStepIndicator from '../components/RegistrationStepIndicator'
import RegistrationSummaryCard from '../components/RegistrationSummaryCard'
import {
  getPublicRegistrationErrorMessage,
  submitPublicRegistration,
} from '../services/publicRegistrationService'

import './RegistrationPage.css'

type RegistrationFormState = {
  first_name: string
  last_name: string
  email: string
  phone: string
  birth_year: string
  role_requested: string
  club_link: string
  category_requested: string
  requested_team: string
  notes: string
}

type FieldErrors = Partial<Record<keyof RegistrationFormState, string>>

const steps = ['Identité', 'Profil', 'Catégorie', 'Vérification']

const initialForm: RegistrationFormState = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  birth_year: '',
  role_requested: 'joueur',
  club_link: '',
  category_requested: '',
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
  'Club',
  'Non défini',
]

const roleOptions = [
  { value: 'joueur', label: 'Joueur / joueuse' },
  { value: 'parent', label: 'Parent' },
  { value: 'coach', label: 'Coach' },
  { value: 'aide_coach', label: 'Aide coach' },
  { value: 'dirigeant', label: 'Dirigeant' },
  { value: 'benevole', label: 'Bénévole' },
  { value: 'arbitre', label: 'Arbitre' },
  { value: 'otm', label: 'OTM' },
  { value: 'team_staff', label: 'Staff équipe' },
  { value: 'member', label: 'Autre' },
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

function getRoleLabel(value: string) {
  return roleOptions.find((role) => role.value === value)?.label || value
}

function buildNotes(form: RegistrationFormState) {
  const clubLink = normalizeText(form.club_link)
  const notes = normalizeText(form.notes)

  return [
    clubLink ? `Lien avec le club : ${clubLink}` : '',
    notes ? `Informations complémentaires : ${notes}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
}

function validateStep(step: number, form: RegistrationFormState): FieldErrors {
  const errors: FieldErrors = {}

  if (step === 0) {
    if (!normalizeText(form.first_name)) {
      errors.first_name = 'Le prénom est obligatoire.'
    }

    if (!normalizeText(form.last_name)) {
      errors.last_name = 'Le nom est obligatoire.'
    }

    const email = normalizeEmail(form.email)
    if (!email) {
      errors.email = 'L’email est obligatoire.'
    } else if (!isValidEmail(email)) {
      errors.email = 'Merci de renseigner une adresse email valide.'
    }

    const birthYearError = getBirthYearError(form.birth_year)
    if (birthYearError) {
      errors.birth_year = birthYearError
    }
  }

  if (step === 1 && !normalizeText(form.role_requested)) {
    errors.role_requested = 'Merci de choisir un type de demande.'
  }

  if (step === 2 && !normalizeText(form.category_requested)) {
    errors.category_requested = 'Merci de choisir la catégorie concernée.'
  }

  return errors
}

export default function RegistrationPage() {
  const [form, setForm] = useState<RegistrationFormState>(initialForm)
  const [currentStep, setCurrentStep] = useState(0)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [debugMessage, setDebugMessage] = useState<string | null>(null)

  const fullName = useMemo(() => getFullName(form), [form])
  const roleLabel = useMemo(() => getRoleLabel(form.role_requested), [form.role_requested])

  function updateField<K extends keyof RegistrationFormState>(
    key: K,
    value: RegistrationFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))

    setFieldErrors((current) => ({
      ...current,
      [key]: undefined,
    }))
  }

  function resetForm() {
    setForm(initialForm)
    setCurrentStep(0)
    setFieldErrors({})
    setSuccessMessage(null)
    setErrorMessage(null)
    setDebugMessage(null)
  }

  function goToPreviousStep() {
    setErrorMessage(null)
    setDebugMessage(null)
    setFieldErrors({})
    setCurrentStep((step) => Math.max(0, step - 1))
  }

  function goToNextStep() {
    const errors = validateStep(currentStep, form)
    setFieldErrors(errors)
    setErrorMessage(null)

    if (Object.keys(errors).length > 0) {
      return
    }

    setCurrentStep((step) => Math.min(steps.length - 1, step + 1))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setSuccessMessage(null)
    setErrorMessage(null)
    setDebugMessage(null)

    const identityErrors = validateStep(0, form)
    const profileErrors = validateStep(1, form)
    const categoryErrors = validateStep(2, form)
    const allErrors = {
      ...identityErrors,
      ...profileErrors,
      ...categoryErrors,
    }

    setFieldErrors(allErrors)

    if (Object.keys(allErrors).length > 0) {
      if (Object.keys(identityErrors).length > 0) setCurrentStep(0)
      else if (Object.keys(profileErrors).length > 0) setCurrentStep(1)
      else setCurrentStep(2)
      setErrorMessage('Merci de compléter les champs obligatoires avant l’envoi.')
      return
    }

    try {
      setLoading(true)

      const result = await submitPublicRegistration({
        firstName: normalizeText(form.first_name),
        lastName: normalizeText(form.last_name),
        email: normalizeEmail(form.email),
        phone: normalizeText(form.phone) || undefined,
        birthYear: Number(normalizeText(form.birth_year)),
        categoryRequested: normalizeText(form.category_requested),
        roleRequested: normalizeText(form.role_requested),
        requestedTeam: normalizeText(form.requested_team) || undefined,
        notes: buildNotes(form) || undefined,
      })

      setSuccessMessage(result.message)
      if (import.meta.env.DEV && result.warnings.length > 0) {
        setDebugMessage(`Inscription enregistrée avec avertissements : ${result.warnings.join(' | ')}`)
      }

      setForm(initialForm)
      setCurrentStep(0)
      setFieldErrors({})
    } catch (error) {
      console.error('[RegistrationPage] submit failed:', error)

      setErrorMessage(getPublicRegistrationErrorMessage())
      if (import.meta.env.DEV) {
        setDebugMessage(error instanceof Error ? error.message : String(error))
      }
    } finally {
      setLoading(false)
    }
  }

  function getFieldError(key: keyof RegistrationFormState) {
    return fieldErrors[key]
  }

  return (
    <section className="dashboard-page registration-page">
      <div className="registration-page__hero dashboard-page__hero">
        <div>
          <p className="dashboard-page__eyebrow">BCVB</p>
          <h2 className="dashboard-page__title">Demande d’inscription</h2>
          <p className="dashboard-page__text">
            Défendre fort, courir et partager la balle : demandez votre accès
            à la plateforme club en quelques étapes.
          </p>
        </div>

        <div className="dashboard-page__badge">
          <span className="dashboard-page__badgeLabel">Accès</span>
          <strong>Sécurisé</strong>
        </div>
      </div>

      <article className="registration-page__formCard dashboard-panelCard">
        <div className="registration-page__header">
          <div>
            <p className="bcvb-eyebrow">Formulaire guidé</p>
            <h3 className="dashboard-panelCard__title">
              {steps[currentStep]}
            </h3>
          </div>

          <span className="registration-page__required">
            Champs obligatoires *
          </span>
        </div>

        <RegistrationStepIndicator steps={steps} currentStep={currentStep} />

        {successMessage ? (
          <div className="registration-page__message registration-page__message--success">
            {successMessage}
            {import.meta.env.DEV && debugMessage ? (
              <small className="registration-page__debug">
                Diagnostic dev : {debugMessage}
              </small>
            ) : null}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="registration-page__message registration-page__message--error">
            {errorMessage}
            {import.meta.env.DEV && debugMessage ? (
              <small className="registration-page__debug">
                Diagnostic dev : {debugMessage}
              </small>
            ) : null}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="registration-form">
          {currentStep === 0 ? (
            <section className="registration-page__stepPanel">
              <p className="registration-page__help">
                Ces informations permettent au club de vous identifier et de vous
                recontacter.
              </p>

              <div className="registration-page__grid">
                <div className="registration-page__field">
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
                  />
                  {getFieldError('first_name') ? (
                    <small>{getFieldError('first_name')}</small>
                  ) : null}
                </div>

                <div className="registration-page__field">
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
                  />
                  {getFieldError('last_name') ? (
                    <small>{getFieldError('last_name')}</small>
                  ) : null}
                </div>

                <div className="registration-page__field">
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
                  />
                  {getFieldError('email') ? <small>{getFieldError('email')}</small> : null}
                </div>

                <div className="registration-page__field">
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

                <div className="registration-page__field">
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
                  />
                  {getFieldError('birth_year') ? (
                    <small>{getFieldError('birth_year')}</small>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          {currentStep === 1 ? (
            <section className="registration-page__stepPanel">
              <p className="registration-page__help">
                Choisissez le rôle principal que vous souhaitez avoir sur la plateforme.
              </p>

              <div className="registration-page__grid">
                <div className="registration-page__field">
                  <label className="bcvb-label" htmlFor="role_requested">
                    Type de demande *
                  </label>
                  <select
                    id="role_requested"
                    className="bcvb-input"
                    value={form.role_requested}
                    onChange={(event) => updateField('role_requested', event.target.value)}
                    disabled={loading}
                  >
                    {roleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  {getFieldError('role_requested') ? (
                    <small>{getFieldError('role_requested')}</small>
                  ) : null}
                </div>

                <div className="registration-page__field registration-page__field--wide">
                  <label className="bcvb-label" htmlFor="club_link">
                    Lien avec le club si utile
                  </label>
                  <input
                    id="club_link"
                    className="bcvb-input"
                    type="text"
                    value={form.club_link}
                    onChange={(event) => updateField('club_link', event.target.value)}
                    placeholder="Ex : parent de joueur U11, coach U15, bénévole tournoi..."
                    disabled={loading}
                  />
                </div>
              </div>
            </section>
          ) : null}

          {currentStep === 2 ? (
            <section className="registration-page__stepPanel">
              <p className="registration-page__help">
                Précisez la catégorie, l’équipe ou le groupe concerné pour aider
                le responsable à valider votre accès.
              </p>

              <div className="registration-page__grid">
                <div className="registration-page__field">
                  <label className="bcvb-label" htmlFor="category_requested">
                    Catégorie demandée *
                  </label>
                  <select
                    id="category_requested"
                    className="bcvb-input"
                    value={form.category_requested}
                    onChange={(event) =>
                      updateField('category_requested', event.target.value)
                    }
                    disabled={loading}
                  >
                    <option value="">Choisir une catégorie</option>
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {getFieldError('category_requested') ? (
                    <small>{getFieldError('category_requested')}</small>
                  ) : null}
                </div>

                <div className="registration-page__field">
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

                <div className="registration-page__field registration-page__field--wide">
                  <label className="bcvb-label" htmlFor="notes">
                    Informations complémentaires
                  </label>
                  <textarea
                    id="notes"
                    className="bcvb-input"
                    value={form.notes}
                    onChange={(event) => updateField('notes', event.target.value)}
                    placeholder="Expérience, situation, rôle souhaité, disponibilité..."
                    disabled={loading}
                    rows={5}
                  />
                </div>
              </div>
            </section>
          ) : null}

          {currentStep === 3 ? (
            <section className="registration-page__stepPanel">
              <p className="registration-page__help">
                Votre demande sera étudiée par un responsable du BCVB. Si elle est
                validée, vous recevrez un email pour créer votre mot de passe et
                accéder à votre espace.
              </p>

              <RegistrationSummaryCard
                fullName={fullName}
                email={normalizeEmail(form.email)}
                roleLabel={roleLabel}
                category={form.category_requested}
                team={form.requested_team}
                clubLink={form.club_link}
                notes={form.notes}
              />
            </section>
          ) : null}

          <div className="registration-page__actions">
            <button
              type="button"
              className="bcvb-btn"
              disabled={loading || currentStep === 0}
              onClick={goToPreviousStep}
            >
              Retour
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                className="bcvb-primary-btn"
                disabled={loading}
                onClick={goToNextStep}
              >
                Continuer
              </button>
            ) : (
              <button type="submit" className="bcvb-primary-btn" disabled={loading}>
                {loading ? 'Envoi en cours...' : 'Envoyer ma demande'}
              </button>
            )}

            <button
              type="button"
              className="bcvb-btn"
              disabled={loading}
              onClick={resetForm}
            >
              Réinitialiser
            </button>
          </div>
        </form>
      </article>
    </section>
  )
}
