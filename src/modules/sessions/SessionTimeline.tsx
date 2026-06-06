import { createSituation, type SessionSituation, type TrainingSessionV2 } from './sessionModels'
import { duplicateSituation, reorderSituations } from './sessionUtils'
import { saveSituationTemplate } from './sessionStorage'
import { SessionSituationBlock } from './SessionSituationBlock'

type SessionTimelineProps = {
  session: TrainingSessionV2
  onChange: (session: TrainingSessionV2) => void
}

export function SessionTimeline({ session, onChange }: SessionTimelineProps) {
  function updateSituations(situations: SessionSituation[]) {
    onChange({ ...session, situations: reorderSituations(situations) })
  }

  function updateSituation(id: string, situation: SessionSituation) {
    updateSituations(session.situations.map((item) => item.id === id ? situation : item))
  }

  function move(id: string, delta: number) {
    const index = session.situations.findIndex((situation) => situation.id === id)
    const nextIndex = index + delta
    if (index < 0 || nextIndex < 0 || nextIndex >= session.situations.length) return
    const next = [...session.situations]
    const [item] = next.splice(index, 1)
    next.splice(nextIndex, 0, item)
    updateSituations(next)
  }

  return (
    <section className="session-card">
      <header className="session-section-header">
        <p className="bcvb-eyebrow">Déroulé de séance</p>
        <h2>Situations pédagogiques</h2>
        <button type="button" onClick={() => updateSituations([...session.situations, createSituation({ order: session.situations.length + 1 })])}>Ajouter une situation</button>
      </header>
      <div className="session-timeline">
        {session.situations.map((situation) => (
          <SessionSituationBlock
            situation={situation}
            key={situation.id}
            onChange={(nextSituation) => updateSituation(situation.id, nextSituation)}
            onDuplicate={() => updateSituations([...session.situations, duplicateSituation(situation)])}
            onMoveUp={() => move(situation.id, -1)}
            onMoveDown={() => move(situation.id, 1)}
            onDelete={() => updateSituations(session.situations.filter((item) => item.id !== situation.id))}
            onSaveAsTemplate={() => saveSituationTemplate(situation)}
          />
        ))}
      </div>
    </section>
  )
}
