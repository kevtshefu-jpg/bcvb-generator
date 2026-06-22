import {
  EXPERT_MODE_ITEMS,
  getCoachToolSteps,
  type CoachToolMode,
} from './coachToolMode'

import './coach-tool-mode.css'

type CoachToolModeGuideProps = {
  mode: CoachToolMode
  context: 'session' | 'planning'
}

function getContextLabel(context: 'session' | 'planning') {
  return context === 'session' ? 'Création de séance' : 'Planification sportive'
}

export default function CoachToolModeGuide({
  mode,
  context,
}: CoachToolModeGuideProps) {
  const steps = getCoachToolSteps(context)
  const isNovice = mode === 'novice'

  if (!isNovice) {
    return (
      <section className="coach-mode-guide coach-mode-guide--expert">
        <div className="coach-mode-guide__header">
          <p>Mode expert</p>
          <h2>{getContextLabel(context)}</h2>
          <span>
            Interface complète pour coach confirmé, responsable technique ou admin.
          </span>
        </div>

        <ul className="coach-mode-guide__expertList">
          {EXPERT_MODE_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    )
  }

  return (
    <section className="coach-mode-guide coach-mode-guide--novice">
      <div className="coach-mode-guide__header">
        <p>Parcours guidé</p>
        <h2>{getContextLabel(context)}</h2>
        <span>
          Défendre Fort, Courir et Partager la Balle avec une démarche simple :
          je découvre, je m’exerce, je retranscris en match, je régule.
        </span>
      </div>

      <ol className="coach-mode-guide__steps">
        {steps.map((step, index) => (
          <li className="coach-mode-guide__step" key={step.id}>
            <span className="coach-mode-guide__stepNumber">{index + 1}</span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.description}</p>
              <small>{step.helper}</small>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
