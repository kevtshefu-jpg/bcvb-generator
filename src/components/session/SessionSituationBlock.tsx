import type { SessionSituation } from '../../types/session'
import SessionCourtPanel from './SessionCourtPanel'

const fields: Array<{ key: keyof SessionSituation; label: string; type?: 'textarea' }> = [
  { key: 'title', label: 'Titre' },
  { key: 'time', label: 'Temps' },
  { key: 'objective', label: 'Objectif', type: 'textarea' },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'organisation', label: 'Organisation', type: 'textarea' },
  { key: 'instructions', label: 'Consignes', type: 'textarea' },
  { key: 'evolution', label: 'Évolution', type: 'textarea' },
  { key: 'evaluation', label: 'Évaluation', type: 'textarea' },
  { key: 'observableCriteria', label: 'Critères observables', type: 'textarea' },
  { key: 'quantifiableCriteria', label: 'Critères quantifiables', type: 'textarea' },
  { key: 'vigilance', label: 'Points de vigilance', type: 'textarea' },
  { key: 'corrections', label: 'Corrections', type: 'textarea' },
  { key: 'matchTransfer', label: 'Transfert match', type: 'textarea' },
]

type SessionSituationBlockProps = {
  numero: number
  situation: SessionSituation
  onChange: (situation: SessionSituation) => void
}

export default function SessionSituationBlock({ numero, situation, onChange }: SessionSituationBlockProps) {
  function update<K extends keyof SessionSituation>(key: K, value: SessionSituation[K]) {
    onChange({ ...situation, [key]: value })
  }

  return (
    <article className="session-situation-block">
      <h2>SITUATION {numero}</h2>
      <div className="session-situation-block__grid">
        {fields.map((field) => (
          <label key={field.key}>
            <span>{field.label}</span>
            {field.type === 'textarea' ? (
              <textarea value={String(situation[field.key] ?? '')} onChange={(event) => update(field.key, event.target.value as never)} />
            ) : (
              <input value={String(situation[field.key] ?? '')} onChange={(event) => update(field.key, event.target.value as never)} />
            )}
          </label>
        ))}
      </div>
      <div className="session-situation-block__court">
        <h3>Terrains disponibles</h3>
        <p>Choisir le support de schéma : terrain entier 1, terrain entier 2, demi-terrain 1, demi-terrain 2 ou demi-terrain 3.</p>
        <SessionCourtPanel selected={situation.courtChoice} onSelect={(choice) => update('courtChoice', choice)} />
      </div>
    </article>
  )
}
