import { useId, useState } from 'react'
import { useExperience } from '../context/ExperienceContext'

export default function ExperienceControls() {
  const { mode, textSize, setMode, setTextSize } = useExperience()
  const helpId = useId()
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const modeLabel = mode === 'guided' ? 'Découverte' : 'Expert'

  return (
    <section className="experience-controls" aria-labelledby={helpId}>
      <button
        type="button"
        className="experience-controls__summary"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="experience-controls__icon" aria-hidden="true">A</span>
        <strong id={helpId}>Mode {modeLabel}</strong>
        <span>Modifier</span>
      </button>

      {open ? (
        <div className="experience-controls__panel" id={panelId}>
          <div className="experience-controls__panel-heading">
            <strong>Réglages d’affichage</strong>
            <span>Adaptez l’accompagnement sans changer vos droits.</span>
          </div>

          <div className="experience-controls__group" role="group" aria-label="Niveau d’accompagnement">
            <button type="button" className={mode === 'guided' ? 'is-active' : ''} aria-label="Activer le mode Découverte" aria-pressed={mode === 'guided'} onClick={() => setMode('guided')}>
              Découverte
              <small>Étapes et explications visibles</small>
            </button>
            <button type="button" className={mode === 'compact' ? 'is-active' : ''} aria-label="Activer le mode Expert" aria-pressed={mode === 'compact'} onClick={() => setMode('compact')}>
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
        </div>
      ) : null}
    </section>
  )
}
