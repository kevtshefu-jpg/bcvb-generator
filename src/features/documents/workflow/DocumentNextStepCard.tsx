import type { DocumentWorkflowMode, DocumentWorkflowStep } from './documentWorkflow'

type DocumentNextStepCardProps = {
  step?: DocumentWorkflowStep | null
  mode: DocumentWorkflowMode
  onPrimaryAction?: () => void
}

const modeLabels: Record<DocumentWorkflowMode, string> = {
  creation: 'Création',
  edition: 'Modification',
  improvement: 'Amélioration',
  validation: 'Validation',
  export: 'Export',
}

export function DocumentNextStepCard({
  step,
  mode,
  onPrimaryAction,
}: DocumentNextStepCardProps) {
  const isReady = !step

  return (
    <article className="document-next-step-card bcvb-card-safe">
      <p className="document-next-step-card__eyebrow">
        {isReady ? 'Document prêt' : `Prochaine étape · ${modeLabels[mode]}`}
      </p>
      <h2 className="document-next-step-card__title bcvb-text-clamp-2">
        {step?.title ?? 'Le document peut être exporté ou publié'}
      </h2>
      <p className="document-next-step-card__text bcvb-text-clamp-4">
        {step?.description ?? 'Toutes les étapes essentielles sont validées.'}
      </p>
      <button
        className="document-next-step-card__button bcvb-action-button-safe"
        type="button"
        onClick={onPrimaryAction}
      >
        {step?.actionLabel ?? 'Exporter / publier'}
      </button>
    </article>
  )
}
