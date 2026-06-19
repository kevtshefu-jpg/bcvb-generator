import './action-feedback.css'

type ActionFeedbackProps = {
  type: 'loading' | 'success' | 'error' | 'info'
  title?: string
  message: string
  onClose?: () => void
}

export default function ActionFeedback({ type, title, message, onClose }: ActionFeedbackProps) {
  return (
    <div className={`action-feedback action-feedback--${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <div>
        {title ? <strong>{title}</strong> : null}
        <p>{message}</p>
      </div>

      {onClose ? (
        <button type="button" onClick={onClose} aria-label="Fermer le message">
          Fermer
        </button>
      ) : null}
    </div>
  )
}
