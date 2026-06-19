import type { CoachToolMode } from '../tools/coachToolMode'

type CoachModeToggleProps = {
  mode: CoachToolMode
  onToggle: () => void
  compact?: boolean
}

export default function CoachModeToggle({ mode, onToggle, compact = false }: CoachModeToggleProps) {
  const isNovice = mode === 'novice'

  return (
    <section
      className={[
        'coach-mode-toggle',
        `coach-mode-toggle--${mode}`,
        compact ? 'coach-mode-toggle--compact' : '',
      ].filter(Boolean).join(' ')}
      aria-label="Mode d’utilisation coach"
    >
      <div className="coach-mode-toggle__content">
        <p className="coach-mode-toggle__eyebrow">Mode d’utilisation</p>
        <h2 className="coach-mode-toggle__title">{isNovice ? 'Mode novice' : 'Mode expert'}</h2>
        <p className="coach-mode-toggle__text">
          {isNovice ? 'Guidage activé' : 'Édition rapide'}
        </p>
      </div>

      <button type="button" className="coach-mode-toggle__button" onClick={onToggle}>
        {isNovice ? 'Passer expert' : 'Passer novice'}
      </button>
    </section>
  )
}
