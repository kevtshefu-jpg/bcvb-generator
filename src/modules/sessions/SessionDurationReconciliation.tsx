import type { TrainingSessionV2 } from './sessionModels'
import { getSessionDurationProblem, validateSessionDuration } from './sessionUtils'

type SessionDurationReconciliationProps = {
  session: TrainingSessionV2
  readOnly: boolean
  onChange: (session: TrainingSessionV2) => void
}

/**
 * Never invent minutes or modify drills to hide an inconsistent timetable.
 * The coach may explicitly shorten the stated duration to the actual plan,
 * or edit the pedagogical blocks in the timeline.
 */
export function SessionDurationReconciliation({
  session,
  readOnly,
  onChange,
}: SessionDurationReconciliationProps) {
  const duration = validateSessionDuration(session)
  if (duration.valid) {
    return <p role="status">Durées cohérentes : {duration.announcedMinutes} min planifiées.</p>
  }

  const durationProblem = getSessionDurationProblem(session)
  const canAdoptPlannedDuration = duration.calculatedMinutes > 0
    && Number.isSafeInteger(duration.calculatedMinutes)
    && session.situations.length > 0
    && session.situations.every((situation) => Number.isSafeInteger(situation.durationMinutes) && situation.durationMinutes > 0)

  return (
    <section className="session-warning" aria-label="Réconciliation des durées de séance">
      <h3>Durée de séance à réconcilier</h3>
      <p role="alert">
        {duration.announcedMinutes} min annoncées, {duration.calculatedMinutes} min détaillées :
        {' '}{durationProblem}
      </p>
      <p>
        Deux possibilités : adapter les situations dans le déroulé pour atteindre
        la durée cible, ou retenir explicitement la durée réelle du déroulé.
        Aucune minute ni situation n’est ajoutée automatiquement.
      </p>
      <div className="session-actions">
        <a href="#session-situations">Compléter ou ajuster les situations</a>
        <button
          type="button"
          disabled={readOnly || !canAdoptPlannedDuration}
          onClick={() => onChange({ ...session, durationMinutes: duration.calculatedMinutes })}
        >
          Retenir {duration.calculatedMinutes} min comme durée de séance
        </button>
      </div>
      {readOnly && <p>Cette séance est en lecture seule : aucune durée ne peut être modifiée.</p>}
    </section>
  )
}
