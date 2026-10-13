import { SESSION_TEMPLATES, getSessionTemplate } from './sessionTemplates'
import type { SessionCategory, TrainingSessionV2 } from './sessionModels'
import { getSessionDurationProblem } from './sessionUtils'

type SessionTemplatePickerProps = {
  onPick: (session: TrainingSessionV2) => void
}

export function SessionTemplatePicker({ onPick }: SessionTemplatePickerProps) {
  return (
    <section className="session-card">
      <header className="session-section-header">
        <p className="bcvb-eyebrow">Modèles par catégorie</p>
        <h2>Charger une base en un clic</h2>
      </header>
      <div className="session-template-grid">
        {SESSION_TEMPLATES.map((template) => (
          <article className="session-template-card" key={template.category}>
            <h3>{template.category}</h3>
            <p>{template.theme}</p>
            <span>{template.durationMinutes} min · {template.situations.length} situations</span>
            {getSessionDurationProblem(template) && (
              <p role="status">Durée à corriger : {getSessionDurationProblem(template)} Modèle à adapter avant utilisation.</p>
            )}
            <button type="button" onClick={() => onPick(getSessionTemplate(template.category as SessionCategory))}>Charger modèle</button>
          </article>
        ))}
      </div>
    </section>
  )
}
