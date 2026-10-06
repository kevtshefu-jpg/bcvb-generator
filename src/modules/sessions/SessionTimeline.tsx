import { useEffect, useState } from 'react'
import { createSituation, type SessionSituation, type TrainingSessionV2 } from './sessionModels'
import { duplicateSituation, reorderSituations } from './sessionUtils'
import { saveSituationTemplate } from './sessionStorage'
import { SessionSituationBlock } from './SessionSituationBlock'

type SessionTimelineProps = {
  session: TrainingSessionV2
  onChange: (session: TrainingSessionV2) => void
}

export function SessionTimeline({ session, onChange }: SessionTimelineProps) {
  const [activeSituationId, setActiveSituationId] = useState(session.situations[0]?.id ?? '')

  useEffect(() => {
    if (!session.situations.some((situation) => situation.id === activeSituationId)) {
      setActiveSituationId(session.situations[0]?.id ?? '')
    }
  }, [activeSituationId, session.situations])

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

  function addSituation() {
    const nextSituation = createSituation({ order: session.situations.length + 1 })
    updateSituations([...session.situations, nextSituation])
    setActiveSituationId(nextSituation.id)
  }

  const activeSituation =
    session.situations.find((situation) => situation.id === activeSituationId) ??
    session.situations[0]

  return (
    <section className="session-card session-timeline-workspace">
      <header className="session-section-header">
        <div>
          <p className="bcvb-eyebrow">Déroulé de séance</p>
          <h2>Situations pédagogiques</h2>
        </div>
        <button type="button" onClick={addSituation}>Ajouter une situation</button>
      </header>

      {session.situations.length > 0 && (
        <div className="session-timeline-selector" role="tablist" aria-label="Situations de la séance">
          {session.situations.map((situation) => (
            <button
              type="button"
              role="tab"
              aria-selected={situation.id === activeSituation?.id}
              aria-controls={`session-situation-panel-${situation.id}`}
              id={`session-situation-tab-${situation.id}`}
              tabIndex={situation.id === activeSituation?.id ? 0 : -1}
              className={situation.id === activeSituation?.id ? 'is-active' : ''}
              key={situation.id}
              onClick={() => setActiveSituationId(situation.id)}
            >
              <span>#{situation.order}</span>
              <strong>{situation.title || `Situation ${situation.order}`}</strong>
              <small>{situation.durationMinutes} min · {situation.intensityLevel}</small>
            </button>
          ))}
        </div>
      )}

      <div
        className="session-timeline session-timeline--single"
        role={activeSituation ? 'tabpanel' : undefined}
        id={activeSituation ? `session-situation-panel-${activeSituation.id}` : undefined}
        aria-labelledby={activeSituation ? `session-situation-tab-${activeSituation.id}` : undefined}
      >
        {activeSituation ? (
          <SessionSituationBlock
            situation={activeSituation}
            onChange={(nextSituation) => updateSituation(activeSituation.id, nextSituation)}
            onDuplicate={() => {
              const duplicate = duplicateSituation(activeSituation)
              updateSituations([...session.situations, duplicate])
              setActiveSituationId(duplicate.id)
            }}
            onMoveUp={() => move(activeSituation.id, -1)}
            onMoveDown={() => move(activeSituation.id, 1)}
            onDelete={() => {
              const currentIndex = session.situations.findIndex((item) => item.id === activeSituation.id)
              const remaining = session.situations.filter((item) => item.id !== activeSituation.id)
              updateSituations(remaining)
              setActiveSituationId(remaining[Math.min(currentIndex, remaining.length - 1)]?.id ?? '')
            }}
            onSaveAsTemplate={() => saveSituationTemplate(activeSituation)}
          />
        ) : (
          <div className="session-timeline-empty">
            <strong>Aucune situation</strong>
            <p>Ajoutez une situation pour construire le déroulé de la séance.</p>
            <button type="button" onClick={addSituation}>Ajouter la première situation</button>
          </div>
        )}
      </div>
    </section>
  )
}
