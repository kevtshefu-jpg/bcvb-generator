import type { TrainingSession, SessionSituation } from '../../types/session'
import SessionSituationBlock from './SessionSituationBlock'

function createSituation(index: number): SessionSituation {
  return {
    id: crypto.randomUUID(),
    title: `Situation ${index} - Défendre fort, courir, partager`,
    time: '12 min',
    objective: 'Installer un comportement observable lié à l’identité BCVB.',
    description: 'Décrire précisément la mise en place, le déclenchement et la fin de l’action.',
    organisation: 'Groupes de 3 à 5 joueurs, rotations courtes, intensité maîtrisée.',
    material: 'Ballons, chasubles, plots.',
    instructions: 'Défends fort. Cours dès la récupération. Partage la balle.',
    evolution: 'Simplifier en réduisant l’opposition, complexifier avec contrainte temporelle.',
    evaluation: 'Observer la décision, l’intensité et le transfert en match dirigé.',
    observableCriteria: 'Le joueur lève la tête avant de passer. Le défenseur reste entre son joueur et le panier.',
    quantifiableCriteria: '7 réussites sur 10. 80 % des passages sans perte de balle.',
    coachPoints: 'Corriger court, valoriser le comportement, refaire immédiatement.',
    vigilance: 'Éviter les files d’attente longues et les consignes trop nombreuses.',
    commonErrors: 'Ballon gelé, défense qui suit sans orienter, course arrêtée après passe.',
    corrections: 'Stop court, démonstration, reprise à mi-vitesse puis rythme match.',
    matchTransfer: 'Même comportement attendu sur toutes les possessions officielles.',
    courtChoice: index % 2 === 0 ? 'full-1' : 'half-1',
  }
}

type SessionSheetEditorProps = {
  session: TrainingSession
  onChange: (session: TrainingSession) => void
}

export default function SessionSheetEditor({ session, onChange }: SessionSheetEditorProps) {
  function update<K extends keyof TrainingSession>(key: K, value: TrainingSession[K]) {
    onChange({ ...session, [key]: value })
  }

  function updateSituation(id: string, situation: SessionSituation) {
    update('situations', session.situations.map((item) => (item.id === id ? situation : item)))
  }

  return (
    <section className="bcvb-tool-card coach-form-card">
      <h2>FICHE SÉANCE BCVB</h2>
      <div className="coach-form-grid">
        <input value={session.team} onChange={(event) => update('team', event.target.value)} placeholder="Équipe" />
        <input value={session.category} onChange={(event) => update('category', event.target.value)} placeholder="Catégorie" />
        <input type="date" value={session.date} onChange={(event) => update('date', event.target.value)} />
        <input value={session.coach} onChange={(event) => update('coach', event.target.value)} placeholder="Coach" />
        <input value={session.totalDuration} onChange={(event) => update('totalDuration', event.target.value)} placeholder="Durée" />
        <input value={session.theme ?? ''} onChange={(event) => update('theme', event.target.value)} placeholder="Thème" />
        <input value={session.title} onChange={(event) => update('title', event.target.value)} placeholder="Titre séance" />
        <input value={session.location} onChange={(event) => update('location', event.target.value)} placeholder="Lieu" />
        <select value={session.format} onChange={(event) => update('format', event.target.value as TrainingSession['format'])}>
          <option>A4 portrait</option>
          <option>A4 paysage</option>
        </select>
        <textarea value={session.mainObjective} onChange={(event) => update('mainObjective', event.target.value)} placeholder="Objectif principal" />
        <textarea value={session.secondaryObjectives} onChange={(event) => update('secondaryObjectives', event.target.value)} placeholder="Objectifs secondaires" />
        <textarea value={session.material} onChange={(event) => update('material', event.target.value)} placeholder="Matériel" />
        <input value={session.playerCount} onChange={(event) => update('playerCount', event.target.value)} placeholder="Nombre de joueurs" />
        <textarea value={session.generalOrganisation} onChange={(event) => update('generalOrganisation', event.target.value)} placeholder="Organisation générale" />
        <input value={session.pedagogicalStep} onChange={(event) => update('pedagogicalStep', event.target.value)} placeholder="Démarche BCVB : Je découvre / Je m’exerce / Je retranscris / Je régule" />
      </div>

      <div className="coach-actions">
        <button className="bcvb-button-primary" type="button" onClick={() => update('situations', [...session.situations, createSituation(session.situations.length + 1)])}>Ajouter une situation</button>
      </div>

      {session.situations.map((situation, index) => (
        <SessionSituationBlock key={situation.id} numero={index + 1} situation={situation} onChange={(next) => updateSituation(situation.id, next)} />
      ))}
    </section>
  )
}
