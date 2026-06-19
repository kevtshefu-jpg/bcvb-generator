import type { CoachToolMode } from '../tools/coachToolMode'

type CoachGuidancePanelProps = {
  mode: CoachToolMode
  tool: 'session' | 'planning'
}

const noviceCopy = {
  session: {
    title: 'Construire une séance simple et cohérente',
    text:
      'Avance étape par étape. Commence par l’objectif, puis choisis les situations. Une bonne séance BCVB doit être claire, active, intense et reliée au match.',
    checklist: [
      'Objectif principal défini',
      'Catégorie renseignée',
      'Intensité prévue',
      'Temps de jeu suffisant',
      'Lien avec le match identifié',
    ],
  },
  planning: {
    title: 'Planifier sans se perdre',
    text:
      'Commence par la période, puis répartis les priorités. La planification doit aider le coach à savoir quoi travailler, quand le travailler et comment réguler.',
    checklist: [
      'Période définie',
      'Priorités BCVB choisies',
      'Progression logique',
      'Alternance intensité/récupération',
      'Évaluation prévue',
    ],
  },
}

export default function CoachGuidancePanel({ mode, tool }: CoachGuidancePanelProps) {
  const isExpert = mode === 'expert'
  const copy = noviceCopy[tool]

  return (
    <section className={`coach-guidance-panel coach-guidance-panel--${mode}`}>
      <div>
        <p className="coach-guidance-panel__eyebrow">
          {tool === 'session' ? 'Créateur de séance' : 'Planification sportive'}
        </p>
        <h2 className="coach-guidance-panel__title">
          {isExpert ? 'Mode expert actif' : copy.title}
        </h2>
        <p className="coach-guidance-panel__text">
          {isExpert
            ? 'Les aides sont réduites. Utilise directement les champs avancés, les modèles, les exports et les ajustements fins.'
            : copy.text}
        </p>
      </div>

      {!isExpert && (
        <ul className="coach-guidance-panel__list">
          {copy.checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
