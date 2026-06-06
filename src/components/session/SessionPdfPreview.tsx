import type { TrainingSession } from '../../types/session'
import FibaCourt from '../court/FibaCourt'

export default function SessionPdfPreview({ session }: { session: TrainingSession }) {
  return (
    <section className="session-pdf-preview">
      <header>
        <p>Basket Club Villefranche Beaujolais</p>
        <h2>FICHE SÉANCE BCVB</h2>
        <span>{session.team} - {session.category} - {session.date} - {session.coach} - {session.totalDuration}</span>
      </header>
      <div className="session-pdf-preview__meta">
        <strong>Thème</strong>
        <p>{session.theme}</p>
        <strong>Objectif principal</strong>
        <p>{session.mainObjective}</p>
        <strong>Objectifs secondaires</strong>
        <p>{session.secondaryObjectives}</p>
        <strong>Matériel</strong>
        <p>{session.material}</p>
        <strong>Nombre de joueurs</strong>
        <p>{session.playerCount}</p>
        <strong>Démarche</strong>
        <p>{session.pedagogicalStep}</p>
      </div>
      {session.situations.map((situation, index) => (
        <article key={situation.id} className="session-pdf-preview__situation">
          <div>
            <p className="bcvb-eyebrow">SITUATION {index + 1}</p>
            <h3>{situation.title}</h3>
            <p><strong>Temps :</strong> {situation.time}</p>
            <p><strong>Consignes :</strong> {situation.instructions}</p>
            <p><strong>Critères :</strong> {situation.observableCriteria} / {situation.quantifiableCriteria}</p>
          </div>
          <FibaCourt mode={situation.courtChoice.startsWith('full') ? 'full' : 'half'} title={situation.courtChoice} />
        </article>
      ))}
    </section>
  )
}
