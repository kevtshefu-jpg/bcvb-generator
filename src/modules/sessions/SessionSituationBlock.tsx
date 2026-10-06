import type { SessionSituation } from './sessionModels'
import { getPhaseLabel } from './sessionUtils'
import { SessionSituationEditor } from './SessionSituationEditor'

type SessionSituationBlockProps = {
  situation: SessionSituation
  onChange: (situation: SessionSituation) => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
  onSaveAsTemplate: () => void
}

export function SessionSituationBlock({ situation, onChange, onDuplicate, onMoveUp, onMoveDown, onDelete, onSaveAsTemplate }: SessionSituationBlockProps) {
  return (
    <article className="session-situation">
      <header className="session-situation-header">
        <div>
          <span>#{situation.order}</span>
          <h3>{situation.title}</h3>
          <p>{getPhaseLabel(situation.pedagogicalPhase)}</p>
        </div>
        <strong>{situation.durationMinutes} min</strong>
      </header>
      <details className="session-situation-menu">
        <summary aria-label="Actions pour la situation active">••• <span>Actions situation</span></summary>
        <div className="session-situation-menu__panel">
          <button type="button" onClick={onDuplicate}>Dupliquer</button>
          <button type="button" onClick={onMoveUp}>Monter</button>
          <button type="button" onClick={onMoveDown}>Descendre</button>
          <button type="button" onClick={onSaveAsTemplate}>Enregistrer comme modèle</button>
          <button type="button" className="session-situation-menu__danger" onClick={onDelete}>Supprimer</button>
        </div>
      </details>
      <SessionSituationEditor situation={situation} onChange={onChange} />
    </article>
  )
}
