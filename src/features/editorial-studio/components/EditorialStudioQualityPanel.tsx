import type {
  EditorialStudioMetaItem,
  EditorialStudioQualityCheck,
} from '../types/editorialStudioTypes'
import { EditorialStudioFeedback } from './EditorialStudioFeedback'

type EditorialStudioQualityPanelProps = {
  title: string
  status: string
  statusTone: string
  criticalWarningsCount: number
  score: number
  recommendedAction: string
  metadata: EditorialStudioMetaItem[]
  message: string
  checks: EditorialStudioQualityCheck[]
  onCheckAction: (action: string) => void
}

export function EditorialStudioQualityPanel({
  title,
  status,
  statusTone,
  criticalWarningsCount,
  score,
  recommendedAction,
  metadata,
  message,
  checks,
  onCheckAction,
}: EditorialStudioQualityPanelProps) {
  return (
    <>
      <section className="editorial-status-sidebar editorial-quality-panel bcvb-premium-card">
        <p className="bcvb-eyebrow">Assistance</p>
        <h2>{title}</h2>
        <div className={`editorial-publication-status editorial-publication-status--${statusTone}`}>
          <span>{status}</span>
          <small>
            {criticalWarningsCount > 0
              ? `${criticalWarningsCount} warning critique`
              : 'Décision qualité calculée'}
          </small>
        </div>
        <div className="editorial-quality-summary editorial-quality-summary--compact editorial-quality__score">
          <strong>{score}/100</strong>
          <div>
            <p>
              {criticalWarningsCount > 0
                ? 'Publication bloquée tant que les warnings critiques ne sont pas traités.'
                : recommendedAction}
            </p>
          </div>
        </div>
        <dl>
          {metadata.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
        <EditorialStudioFeedback type="info" message={message} />
      </section>

      <section className="editorial-panel editorial-step-card editorial-assist-panel editorial-quality">
        <header>
          <p className="bcvb-eyebrow">Sous-scores</p>
          <h2>Score actionnable</h2>
        </header>
        <div className="editorial-quality-breakdown">
          {checks.map((item) => (
            <article
              className={[
                item.value >= 75 ? 'is-ok' : 'is-low',
                'editorial-quality__check',
                item.value >= 75 ? 'editorial-quality__check--ok' : 'editorial-quality__check--warning',
              ].join(' ')}
              key={item.id}
            >
              <div>
                <span>{item.label}</span>
                <strong>{item.value}/100</strong>
              </div>
              <p>{item.explanation}</p>
              <button type="button" onClick={() => onCheckAction(item.action)}>
                {item.action}
              </button>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
