import type { EditorialStudioFeedbackType } from '../types/editorialStudioTypes'

type EditorialStudioFeedbackProps = {
  type?: EditorialStudioFeedbackType
  message: string
  onClose?: () => void
}

export function EditorialStudioFeedback({
  type = 'info',
  message,
  onClose,
}: EditorialStudioFeedbackProps) {
  if (!message) return null

  return (
    <p className={`editorial-feedback editorial-feedback--${type}`} role="status">
      <span>{message}</span>
      {onClose ? (
        <button type="button" onClick={onClose} aria-label="Fermer le message">
          x
        </button>
      ) : null}
    </p>
  )
}
