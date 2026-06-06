import type { TrainingSessionV2 } from './sessionModels'
import { getTotalSituationDuration } from './sessionUtils'

export function SessionQuickSummary({ session }: { session: TrainingSessionV2 }) {
  return (
    <div className="session-quick-summary">
      <article><span>Durée prévue</span><strong>{session.durationMinutes} min</strong></article>
      <article><span>Déroulé</span><strong>{getTotalSituationDuration(session)} min</strong></article>
      <article><span>Situations</span><strong>{session.situations.length}</strong></article>
      <article><span>Effectif</span><strong>{session.expectedPlayers || '—'}</strong></article>
    </div>
  )
}
