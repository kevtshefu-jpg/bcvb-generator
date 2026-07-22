import { useId } from 'react'
import { useExperience } from '../context/ExperienceContext'

export default function ExperienceControls() {
  const { mode, textSize, setMode, setTextSize } = useExperience()
  const helpId = useId()

  return (
    <section className="experience-controls" aria-labelledby={helpId}>
      <div className="experience-controls__intro">
        <span className="experience-controls__icon" aria-hidden="true">Aa</span>
        <div>
          <strong id={helpId}>Niveau d’accompagnement</strong>
          <span>Le mode Découverte est conseillé pour commencer.</span>
        </div>
      </div>

      <div className="experience-controls__group" role="group" aria-label="Niveau d’accompagnement">
        <button type="button" className={mode === 'guided' ? 'is-active' : ''} aria-pressed={mode === 'guided'} onClick={() => setMode('guided')}>
          Découverte
          <small>Étapes et explications visibles</small>
        </button>
        <button type="button" className={mode === 'compact' ? 'is-active' : ''} aria-pressed={mode === 'compact'} onClick={() => setMode('compact')}>
          Expert
          <small>Interface compacte et outils avancés</small>
        </button>
      </div>

      <button
        type="button"
        className="experience-controls__text-size"
        aria-pressed={textSize === 'large'}
        onClick={() => setTextSize(textSize === 'large' ? 'standard' : 'large')}
      >
        {textSize === 'large' ? 'Texte standard' : 'Agrandir le texte'}
      </button>
    </section>
  )
}
