import { FibaCourtFull } from '../../components/courts/FibaCourtFull'
import { FibaCourtHalf } from '../../components/courts/FibaCourtHalf'
import type { TrainingSessionV2 } from './sessionModels'
import { getPhaseLabel } from './sessionUtils'

type SessionPreviewProps = {
  session: TrainingSessionV2
  mode: 'edition' | 'coach' | 'print'
}

export function SessionPreview({ session, mode }: SessionPreviewProps) {
  return (
    <section className={`session-preview session-preview--${mode}`}>
      <header>
        <p className="bcvb-eyebrow">{mode === 'coach' ? 'Vue coach terrain' : mode === 'print' ? 'Vue impression PDF' : 'Vue édition'}</p>
        <h2>{session.title}</h2>
        <p>{session.category} · {session.theme} · {session.subTheme} · {session.durationMinutes} min · {session.expectedPlayers} joueurs</p>
      </header>
      <article className="session-print-cover">
        <div>
          <h3>Objectifs</h3>
          <ul>{session.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul>
        </div>
        <div>
          <h3>Matériel</h3>
          <p>{session.equipment.join(', ') || 'À renseigner'}</p>
        </div>
        <div>
          <h3>Déroulé synthétique</h3>
          <ol>{session.situations.map((situation) => <li key={situation.id}>{situation.title} - {situation.durationMinutes} min</li>)}</ol>
        </div>
      </article>
      {session.situations.map((situation) => (
        <article className="session-print-page" key={situation.id}>
          <div>
            <h3>{situation.order}. {situation.title}</h3>
            <strong>{situation.durationMinutes} min · {getPhaseLabel(situation.pedagogicalPhase)}</strong>
            <p>{situation.objective}</p>
            <p><b>Organisation :</b> {situation.organization}</p>
            <p><b>Consignes :</b> {situation.instructions}</p>
            <p><b>Évolution :</b> {situation.evolution}</p>
            <p><b>Régression :</b> {situation.regression}</p>
            <p><b>Critères :</b> {[...situation.observableCriteria, ...situation.measurableCriteria].join(' · ')}</p>
          </div>
          <div className={`session-preview-courts session-preview-courts--${Math.min(3, situation.courtFrames.length)}`}>
            {situation.courtFrames.slice(0, 3).map((frame) => (
              frame.courtType === 'full'
                ? <FibaCourtFull frame={frame} key={frame.id} />
                : <FibaCourtHalf frame={frame} key={frame.id} />
            ))}
          </div>
        </article>
      ))}
    </section>
  )
}
