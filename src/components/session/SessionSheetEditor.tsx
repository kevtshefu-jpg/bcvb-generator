import type { TrainingSession, SessionSituation } from '../../types/session'
import SessionSituationBlock from './SessionSituationBlock'

function createSituation(index: number): SessionSituation {
  return {
    id: crypto.randomUUID(),
    title: `Situation ${index} - Défendre fort, courir, partager`,
    time: '12 min',
    objective: `Installer un comportement observable lié à l'identité BCVB.`,
    description: `Décrire précisément la mise en place, le déclenchement et la fin de l'action.`,
    organisation: 'Groupes de 3 à 5 joueurs, rotations courtes, intensité maîtrisée.',
    material: 'Ballons, chasubles, plots.',
    instructions: 'Défends fort. Cours dès la récupération. Partage la balle.',
    evolution: `Simplifier en réduisant l'opposition, complexifier avec contrainte temporelle.`,
    evaluation: `Observer la décision, l'intensité et le transfert en match dirigé.`,
    observableCriteria:
      'Le joueur lève la tête avant de passer. Le défenseur reste entre son joueur et le panier.',
    quantifiableCriteria: '7 réussites sur 10. 80 % des passages sans perte de balle.',
    coachPoints: 'Corriger court, valoriser le comportement, refaire immédiatement.',
    vigilance: `Éviter les files d'attente longues et les consignes trop nombreuses.`,
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

export default function SessionSheetEditor({
  session,
  onChange,
}: SessionSheetEditorProps) {
  function update<K extends keyof TrainingSession>(
    key: K,
    value: TrainingSession[K]
  ) {
    onChange({
      ...session,
      [key]: value,
    })
  }

  function updateSituation(id: string, situation: SessionSituation) {
    update(
      'situations',
      session.situations.map((item) => (item.id === id ? situation : item))
    )
  }

  function addSituation() {
    update('situations', [
      ...session.situations,
      createSituation(session.situations.length + 1),
    ])
  }

  return (
    <section className="bcvb-tool-card coach-form-card">
      <h2>FICHE SÉANCE BCVB</h2>

      <fieldset className="coach-form-grid">
        <legend className="sr-only">
          Informations de la séance d&apos;entraînement
        </legend>

        <div className="form-field">
          <label htmlFor="session-team">Équipe</label>
          <input
            id="session-team"
            value={session.team}
            onChange={(event) => update('team', event.target.value)}
            placeholder="Ex: U9 A"
          />
        </div>

        <div className="form-field">
          <label htmlFor="session-category">Catégorie</label>
          <input
            id="session-category"
            value={session.category}
            onChange={(event) => update('category', event.target.value)}
            placeholder="Ex: U9"
          />
        </div>

        <div className="form-field">
          <label htmlFor="session-date">Date</label>
          <input
            id="session-date"
            type="date"
            value={session.date}
            onChange={(event) => update('date', event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="session-coach">Coach</label>
          <input
            id="session-coach"
            value={session.coach}
            onChange={(event) => update('coach', event.target.value)}
            placeholder="Nom du coach"
          />
        </div>

        <div className="form-field">
          <label htmlFor="session-duration">Durée</label>
          <input
            id="session-duration"
            value={session.totalDuration}
            onChange={(event) => update('totalDuration', event.target.value)}
            placeholder="Ex: 90 min"
          />
        </div>

        <div className="form-field">
          <label htmlFor="session-theme">Thème</label>
          <input
            id="session-theme"
            value={session.theme ?? ''}
            onChange={(event) => update('theme', event.target.value)}
            placeholder="Thème de séance"
          />
        </div>

        <div className="form-field">
          <label htmlFor="session-title">Titre séance</label>
          <input
            id="session-title"
            value={session.title}
            onChange={(event) => update('title', event.target.value)}
            placeholder="Titre descriptif"
          />
        </div>

        <div className="form-field">
          <label htmlFor="session-location">Lieu</label>
          <input
            id="session-location"
            value={session.location}
            onChange={(event) => update('location', event.target.value)}
            placeholder="Nom du lieu"
          />
        </div>

        <div className="form-field">
          <label htmlFor="session-format">Format</label>
          <select
            id="session-format"
            value={session.format}
            onChange={(event) =>
              update('format', event.target.value as TrainingSession['format'])
            }
          >
            <option>A4 portrait</option>
            <option>A4 paysage</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="session-objective">Objectif principal</label>
          <textarea
            id="session-objective"
            value={session.mainObjective}
            onChange={(event) => update('mainObjective', event.target.value)}
            placeholder="Décrire l'objectif principal"
          />
        </div>

        <div className="form-field">
          <label htmlFor="session-secondary">Objectifs secondaires</label>
          <textarea
            id="session-secondary"
            value={session.secondaryObjectives}
            onChange={(event) =>
              update('secondaryObjectives', event.target.value)
            }
            placeholder="Objectifs additionnels"
          />
        </div>

        <div className="form-field">
          <label htmlFor="session-material">Matériel</label>
          <textarea
            id="session-material"
            value={session.material}
            onChange={(event) => update('material', event.target.value)}
            placeholder="Liste du matériel nécessaire"
          />
        </div>

        <div className="form-field">
          <label htmlFor="session-players">Nombre de joueurs</label>
          <input
            id="session-players"
            value={session.playerCount}
            onChange={(event) => update('playerCount', event.target.value)}
            placeholder="Ex: 12"
          />
        </div>

        <div className="form-field">
          <label htmlFor="session-org">Organisation générale</label>
          <textarea
            id="session-org"
            value={session.generalOrganisation}
            onChange={(event) =>
              update('generalOrganisation', event.target.value)
            }
            placeholder="Structure et organisation de la séance"
          />
        </div>

        <div className="form-field">
          <label htmlFor="session-step">Démarche pédagogique</label>
          <input
            id="session-step"
            value={session.pedagogicalStep}
            onChange={(event) => update('pedagogicalStep', event.target.value)}
            placeholder="Je découvre / Je m'exerce / Je retranscris / Je régule"
          />
        </div>
      </fieldset>

      <div className="coach-actions">
        <button
          className="bcvb-button-primary"
          type="button"
          onClick={addSituation}
        >
          Ajouter une situation
        </button>
      </div>

      {session.situations.map((situation, index) => (
        <SessionSituationBlock
          key={situation.id}
          numero={index + 1}
          situation={situation}
          onChange={(next) => updateSituation(situation.id, next)}
        />
      ))}
    </section>
  )
}