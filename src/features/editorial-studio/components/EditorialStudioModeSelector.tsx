import { editorialStudioModeOptions } from '../utils/editorialStudioLabels'

type EditorialStudioModeSelectorProps = {
  mode: string
  onModeChange: (mode: string) => void
}

export function EditorialStudioModeSelector({
  mode,
  onModeChange,
}: EditorialStudioModeSelectorProps) {
  return (
    <section className="editorial-mode-selector" aria-label="Choix du mode studio">
      {editorialStudioModeOptions.map((option) => {
        const isActive = option.id === mode

        return (
          <button
            type="button"
            className={[
              'editorial-mode-selector__card',
              isActive ? 'editorial-mode-selector__card--active' : '',
            ].filter(Boolean).join(' ')}
            aria-pressed={isActive}
            onClick={() => onModeChange(option.id)}
            key={option.id}
          >
            <span>{option.title}</span>
            <strong>{option.description}</strong>
            <small>{option.recommendation}</small>
          </button>
        )
      })}
    </section>
  )
}
