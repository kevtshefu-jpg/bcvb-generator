import { createMetric, type SessionMetric } from './sessionModels'

type SituationMetricsEditorProps = {
  metrics: SessionMetric[]
  onChange: (metrics: SessionMetric[]) => void
}

function computeSuccess(metric: SessionMetric) {
  const observed = Number(metric.observed)
  const target = Number(metric.target)
  if (!Number.isFinite(observed) || !Number.isFinite(target) || target <= 0) return '—'
  const rate = metric.type === 'percentage' ? observed : Math.round((observed / target) * 100)
  return `${Math.min(100, Math.max(0, rate))}%`
}

export function SituationMetricsEditor({ metrics, onChange }: SituationMetricsEditorProps) {
  function update(id: string, patch: Partial<SessionMetric>) {
    onChange(metrics.map((metric) => metric.id === id ? { ...metric, ...patch } : metric))
  }

  return (
    <div className="session-metrics-editor">
      <div className="session-subheader">
        <h4>Critères quantifiables</h4>
        <button type="button" onClick={() => onChange([...metrics, createMetric({ label: 'Nouveau critère', target: '5' })])}>Ajouter un critère</button>
      </div>
      {metrics.map((metric) => (
        <div className="session-metric-row" key={metric.id}>
          <input value={metric.label} onChange={(event) => update(metric.id, { label: event.target.value })} placeholder="Ex : 7 tirs réussis sur 10" />
          <select value={metric.type} onChange={(event) => update(metric.id, { type: event.target.value as SessionMetric['type'] })}>
            <option value="count">count</option>
            <option value="percentage">percentage</option>
            <option value="duration">duration</option>
            <option value="rating">rating</option>
            <option value="text">text</option>
          </select>
          <input value={metric.target} onChange={(event) => update(metric.id, { target: event.target.value })} placeholder="Cible" />
          <input value={metric.observed} onChange={(event) => update(metric.id, { observed: event.target.value })} placeholder="Observé" />
          <input value={metric.unit} onChange={(event) => update(metric.id, { unit: event.target.value })} placeholder="Unité" />
          <span>{computeSuccess(metric)}</span>
          <button type="button" onClick={() => onChange(metrics.filter((item) => item.id !== metric.id))}>Supprimer</button>
          <textarea value={metric.notes} onChange={(event) => update(metric.id, { notes: event.target.value })} placeholder="Note" />
        </div>
      ))}
    </div>
  )
}
