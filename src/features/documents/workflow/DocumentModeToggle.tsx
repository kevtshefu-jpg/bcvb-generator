import type { DocumentWorkflowMode } from './documentWorkflow'

type DocumentModeToggleProps = {
  mode: DocumentWorkflowMode
  onChange: (mode: DocumentWorkflowMode) => void
}

const modes: Array<{ key: DocumentWorkflowMode; label: string; hint: string }> = [
  { key: 'creation', label: 'Créer', hint: 'Nouveau document' },
  { key: 'edition', label: 'Modifier', hint: 'Document existant' },
  { key: 'improvement', label: 'Améliorer', hint: 'Qualité et structure' },
  { key: 'validation', label: 'Valider', hint: 'Relecture club' },
  { key: 'export', label: 'Exporter', hint: 'Diffusion' },
]

export function DocumentModeToggle({ mode, onChange }: DocumentModeToggleProps) {
  return (
    <div className="document-mode-toggle" role="group" aria-label="Mode de travail documentaire">
      {modes.map((item) => (
        <button
          className={[
            'document-mode-toggle__button',
            mode === item.key ? 'document-mode-toggle__button--active' : '',
          ].filter(Boolean).join(' ')}
          type="button"
          onClick={() => onChange(item.key)}
          aria-pressed={mode === item.key}
          key={item.key}
        >
          <strong>{item.label}</strong>
          <span>{item.hint}</span>
        </button>
      ))}
    </div>
  )
}
