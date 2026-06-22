import type { EditorialStudioQuickAction } from '../types/editorialStudioTypes'

type PublicationChecklistItem = {
  label: string
  done: boolean
  helper: string
}

type EditorialStudioAssistancePanelsProps = {
  qualityActions: string[]
  warnings: string[]
  quickActions: EditorialStudioQuickAction[]
  publicationChecklist: PublicationChecklistItem[]
}

export function EditorialStudioAssistancePanels({
  qualityActions,
  warnings,
  quickActions,
  publicationChecklist,
}: EditorialStudioAssistancePanelsProps) {
  return (
    <>
      <section className="editorial-panel editorial-step-card editorial-assist-panel">
        <header>
          <p className="bcvb-eyebrow">Recommandations</p>
          <h2>À améliorer</h2>
        </header>
        <ul className="editorial-assist-list">
          {qualityActions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      </section>

      <section className="editorial-panel editorial-step-card editorial-assist-panel">
        <header>
          <p className="bcvb-eyebrow">Warnings</p>
          <h2>Points à relire</h2>
        </header>
        <ul className="editorial-warning-list">
          {warnings.length > 0 ? warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          )) : <li>Aucun warning majeur détecté.</li>}
        </ul>
      </section>

      <section className="editorial-panel editorial-step-card editorial-assist-panel">
        <header>
          <p className="bcvb-eyebrow">Actions rapides</p>
          <h2>Améliorer sans chercher</h2>
        </header>
        <div className="editorial-quick-actions">
          {quickActions.map((item) => (
            <button type="button" key={item.label} onClick={item.action}>
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="editorial-panel editorial-step-card editorial-assist-panel">
        <header>
          <p className="bcvb-eyebrow">Checklist publication</p>
          <h2>Avant diffusion</h2>
        </header>
        <ul className="editorial-checklist">
          {publicationChecklist.map((item) => (
            <li className={item.done ? 'is-done' : 'is-missing'} key={item.label}>
              <strong>{item.done ? 'OK' : 'À faire'} - {item.label}</strong>
              <span>{item.helper}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
