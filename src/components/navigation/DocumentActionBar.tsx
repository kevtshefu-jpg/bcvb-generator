export type DocumentAction = {
  id: string
  label: string
  detail?: string
  tone?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  onClick: () => void
}

type DocumentActionBarProps = {
  documentTitle: string
  activeStepLabel: string
  qualityLabel?: string
  actions: DocumentAction[]
}

export function DocumentActionBar({
  documentTitle,
  activeStepLabel,
  qualityLabel,
  actions,
}: DocumentActionBarProps) {
  return (
    <aside className="document-action-bar no-print" aria-label="Actions persistantes du document">
      <div className="document-action-bar__context">
        <span>Document actif</span>
        <strong>{documentTitle}</strong>
        <em>{activeStepLabel}{qualityLabel ? ` · ${qualityLabel}` : ''}</em>
      </div>
      <div className="document-action-bar__actions">
        {actions.map((action) => (
          <button
            type="button"
            key={action.id}
            className={`document-action-bar__button document-action-bar__button--${action.tone ?? 'secondary'}`}
            disabled={action.disabled}
            onClick={action.onClick}
            title={action.detail}
          >
            {action.label}
          </button>
        ))}
      </div>
    </aside>
  )
}
