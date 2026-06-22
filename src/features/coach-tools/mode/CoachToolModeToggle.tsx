import type { CoachToolMode } from './coachToolMode'

type CoachToolModeToggleProps = {
  mode: CoachToolMode
  onChange: (mode: CoachToolMode) => void
}

export default function CoachToolModeToggle({
  mode,
  onChange,
}: CoachToolModeToggleProps) {
  return (
    <section className="coach-mode-toggle" aria-label="Mode d’utilisation coach">
      <div className="coach-mode-toggle__copy">
        <p className="coach-mode-toggle__eyebrow">Mode coach</p>
        <h2>{mode === 'novice' ? 'Guidage activé' : 'Pilotage expert'}</h2>
        <p>
          {mode === 'novice'
            ? 'Novice : guidé étape par étape'
            : 'Expert : libre et avancé'}
        </p>
      </div>

      <div className="coach-mode-toggle__actions" role="group" aria-label="Choisir le mode">
        <button
          type="button"
          className={[
            'coach-mode-toggle__button',
            mode === 'novice' ? 'coach-mode-toggle__button--active' : '',
          ].filter(Boolean).join(' ')}
          onClick={() => onChange('novice')}
          aria-pressed={mode === 'novice'}
        >
          Mode novice
        </button>

        <button
          type="button"
          className={[
            'coach-mode-toggle__button',
            mode === 'expert' ? 'coach-mode-toggle__button--active' : '',
          ].filter(Boolean).join(' ')}
          onClick={() => onChange('expert')}
          aria-pressed={mode === 'expert'}
        >
          Mode expert
        </button>
      </div>
    </section>
  )
}
