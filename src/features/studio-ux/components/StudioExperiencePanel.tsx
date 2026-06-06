import { Link } from 'react-router-dom'
import { buildStudioExperience } from '../services/studioExperience'
import '../styles/studioExperience.css'

type StudioExperiencePanelProps = {
  role?: string | null
}

const statusLabels = {
  pret: 'Prêt',
  a_finaliser: 'À finaliser',
  reserve_admin: 'Admin',
}

const stepLabels = {
  done: 'Fait',
  current: 'En cours',
  next: 'Suite',
}

export default function StudioExperiencePanel({ role }: StudioExperiencePanelProps) {
  const experience = buildStudioExperience(role)

  return (
    <section className="studio-experience" aria-labelledby="studio-experience-title">
      <header className="studio-experience__header">
        <div>
          <p className="bcvb-eyebrow">Boussole BCVB</p>
          <h2 id="studio-experience-title">{experience.headline}</h2>
          <p>{experience.subtitle}</p>
        </div>
        <div className="studio-experience__identity">
          <span>Philosophie</span>
          <strong>Défendre Fort · Courir · Partager</strong>
        </div>
      </header>

      <div className="studio-experience__grid">
        <div className="studio-experience__intents">
          {experience.intents.map((intent) => {
            const primaryCategory = intent.categories[0]

            return (
              <article className={`studio-intent studio-intent--${intent.status}`} key={intent.id}>
                <div className="studio-intent__topline">
                  <span>{statusLabels[intent.status]}</span>
                  <strong>{intent.title}</strong>
                </div>
                <p className="studio-intent__question">{intent.question}</p>
                <p className="studio-intent__result">{intent.result}</p>
                <div className="studio-intent__actions">
                  <Link to={primaryCategory.path}>Démarrer</Link>
                  {intent.categories.slice(0, 3).map((category) => (
                    <Link to={category.path} className="studio-intent__module" key={category.id}>
                      {category.shortLabel}
                    </Link>
                  ))}
                </div>
              </article>
            )
          })}
        </div>

        <aside className="studio-experience__side">
          <section className="studio-progress-card">
            <p className="bcvb-eyebrow">Avancement lisible</p>
            <h3>Ce que le site doit toujours montrer</h3>
            <ol>
              {experience.progress.map((step) => (
                <li className={`studio-progress-step studio-progress-step--${step.state}`} key={step.label}>
                  <span>{stepLabels[step.state]}</span>
                  <div>
                    <strong>{step.label}</strong>
                    <p>{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="studio-priority-card">
            <p className="bcvb-eyebrow">À ne pas rater</p>
            <div className="studio-priority-list">
              {experience.priorities.map((priority) => (
                <article className={`studio-priority studio-priority--${priority.tone}`} key={priority.label}>
                  <strong>{priority.label}</strong>
                  <p>{priority.detail}</p>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </section>
  )
}
