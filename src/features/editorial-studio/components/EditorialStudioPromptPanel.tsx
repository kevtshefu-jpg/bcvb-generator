import type { EditorialStudioPromptAction } from '../types/editorialStudioTypes'
import { editorialPromptShortcuts } from '../utils/editorialStudioLabels'
import { EditorialStudioFeedback } from './EditorialStudioFeedback'

type EditorialStudioPromptPanelProps = {
  prompt: string
  copiedMessage?: string
  disabled?: boolean
  actions?: EditorialStudioPromptAction[]
  onPromptChange: (value: string) => void
}

export function EditorialStudioPromptPanel({
  prompt,
  copiedMessage = '',
  disabled = false,
  actions = [],
  onPromptChange,
}: EditorialStudioPromptPanelProps) {
  function appendShortcut(shortcut: string) {
    const nextPrompt = `${prompt.trim() ? `${prompt.trim()}\n\n` : ''}Consigne : ${shortcut}.`
    onPromptChange(nextPrompt)
  }

  return (
    <section className="editorial-panel editorial-step-card editorial-prompt-panel">
      <header>
        <p className="bcvb-eyebrow">Source</p>
        <h2>Cadre de rédaction</h2>
      </header>
      <textarea
        className="editorial-textarea editorial-textarea--small"
        value={prompt}
        disabled={disabled}
        onChange={(event) => onPromptChange(event.target.value)}
        placeholder="Cadre initial ou consigne préparée par le module Créer."
      />
      <div className="editorial-prompt-panel__help">
        <span>Soyez précis sur le public cible.</span>
        <span>Indiquez le niveau de détail attendu.</span>
        <span>Ajoutez les contraintes BCVB si nécessaire.</span>
        <span>Précisez si le document doit être court, opérationnel ou complet.</span>
      </div>
      <div className="editorial-prompt-panel__shortcuts">
        {editorialPromptShortcuts.map((shortcut) => (
          <button type="button" disabled={disabled} onClick={() => appendShortcut(shortcut)} key={shortcut}>
            {shortcut}
          </button>
        ))}
      </div>
      {actions.length > 0 ? (
        <div className="editorial-actions">
          {actions.map((action) => (
            <button type="button" disabled={disabled} onClick={action.onClick} key={action.label}>
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
      <EditorialStudioFeedback type="success" message={copiedMessage} />
    </section>
  )
}
