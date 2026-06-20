import {
  getStepStatusLabel,
  getWorkflowProgress,
  type DocumentWorkflowMode,
  type DocumentWorkflowStep,
  type DocumentWorkflowStepKey,
} from './documentWorkflow'

type DocumentWorkflowAssistantCardProps = {
  steps: DocumentWorkflowStep[]
  mode: DocumentWorkflowMode
  currentStepKey?: DocumentWorkflowStepKey
  nextStep?: DocumentWorkflowStep | null
  onPrimaryAction?: () => void
  onOpenStep?: (step: DocumentWorkflowStep) => void
}

const modeLabels: Record<DocumentWorkflowMode, string> = {
  creation: 'Création',
  edition: 'Modification',
  improvement: 'Amélioration',
  validation: 'Validation',
  export: 'Export',
}

function getCurrentStep(steps: DocumentWorkflowStep[], currentStepKey?: DocumentWorkflowStepKey) {
  return (
    steps.find((step) => step.key === currentStepKey) ||
    steps.find((step) => step.status === 'current' || step.status === 'warning') ||
    steps.find((step) => step.status !== 'done') ||
    null
  )
}

export function DocumentWorkflowAssistantCard({
  steps,
  mode,
  currentStepKey,
  nextStep,
  onPrimaryAction,
  onOpenStep,
}: DocumentWorkflowAssistantCardProps) {
  const currentStep = getCurrentStep(steps, currentStepKey)
  const progress = getWorkflowProgress(steps)
  const doneCount = steps.filter((step) => step.status === 'done').length
  const warningSteps = steps.filter((step) => step.status === 'warning')
  const blockedSteps = steps.filter((step) => step.status === 'blocked')
  const attentionSteps = [...warningSteps, ...blockedSteps]
  const targetStep = nextStep ?? currentStep

  return (
    <aside className="document-workflow-assistant bcvb-card-safe" aria-label="Assistant de parcours documentaire">
      <div className="document-workflow-assistant__top">
        <p>Assistant de parcours</p>
        <span>{modeLabels[mode]}</span>
      </div>

      <div className="document-workflow-assistant__headline">
        <strong>{progress}%</strong>
        <div>
          <h2>{currentStep?.title ?? 'Parcours terminé'}</h2>
          <p>
            {currentStep?.description ??
              'Toutes les étapes essentielles sont validées. Tu peux exporter ou archiver la version.'}
          </p>
        </div>
      </div>

      <div className="document-workflow-assistant__metrics">
        <span>{doneCount}/{steps.length} terminées</span>
        <span>{warningSteps.length} à vérifier</span>
        <span>{blockedSteps.length} bloquée{blockedSteps.length > 1 ? 's' : ''}</span>
      </div>

      {attentionSteps.length > 0 ? (
        <div className="document-workflow-assistant__attention">
          <strong>À sécuriser avant publication</strong>
          <ul>
            {attentionSteps.slice(0, 3).map((step) => (
              <li key={`${step.key}-${step.order}`}>
                {step.shortTitle} · {getStepStatusLabel(step.status)}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="document-workflow-assistant__attention document-workflow-assistant__attention--clear">
          <strong>Aucun blocage détecté</strong>
          <p>Le parcours peut avancer vers la prochaine action proposée.</p>
        </div>
      )}

      <div className="document-workflow-assistant__actions">
        <button type="button" onClick={onPrimaryAction}>
          {targetStep?.actionLabel ?? 'Exporter / publier'}
        </button>
        {targetStep && onOpenStep ? (
          <button type="button" onClick={() => onOpenStep(targetStep)}>
            Ouvrir le bloc
          </button>
        ) : null}
      </div>
    </aside>
  )
}
