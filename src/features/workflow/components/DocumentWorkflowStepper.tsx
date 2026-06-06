import '../styles/documentWorkflowStepper.css'

export type DocumentWorkflowStatus = 'todo' | 'in_progress' | 'done' | 'needs_review' | 'error'

export type DocumentWorkflowAction = {
  label: string
  onClick: () => void
  disabled?: boolean
}

export type DocumentWorkflowStep = {
  id: string
  label: string
  status: DocumentWorkflowStatus
  explanation: string
  primaryAction: DocumentWorkflowAction
  secondaryAction: DocumentWorkflowAction
}

type DocumentWorkflowStepperProps = {
  steps: DocumentWorkflowStep[]
  activeStepId: string
  onStepSelect: (stepId: string) => void
}

const statusLabels: Record<DocumentWorkflowStatus, string> = {
  todo: 'À faire',
  in_progress: 'En cours',
  done: 'Terminé',
  needs_review: 'À vérifier',
  error: 'Erreur',
}

const statusOrder: DocumentWorkflowStatus[] = ['error', 'needs_review', 'in_progress', 'todo']

function findNextStep(steps: DocumentWorkflowStep[]) {
  return steps.find((step) => statusOrder.includes(step.status)) ?? steps[steps.length - 1]
}

export default function DocumentWorkflowStepper({
  steps,
  activeStepId,
  onStepSelect,
}: DocumentWorkflowStepperProps) {
  const nextStep = findNextStep(steps)
  const doneCount = steps.filter((step) => step.status === 'done').length
  const progressPercent = Math.round((doneCount / Math.max(steps.length, 1)) * 100)

  return (
    <section className="document-workflow-stepper no-print" aria-labelledby="document-workflow-stepper-title">
      <header className="document-workflow-stepper__header">
        <div>
          <p className="bcvb-eyebrow">Assistant de production</p>
          <h2 id="document-workflow-stepper-title">Parcours guidé du document</h2>
          <p>
            Le site te guide de la source à l’archivage : chaque étape indique son statut, son rôle et l’action suivante.
          </p>
        </div>
        <aside className="document-workflow-stepper__next">
          <span>Prochaine étape</span>
          <strong>{nextStep.label}</strong>
          <button type="button" onClick={nextStep.primaryAction.onClick} disabled={nextStep.primaryAction.disabled}>
            {nextStep.primaryAction.label}
          </button>
        </aside>
      </header>

      <div className="document-workflow-stepper__progress" aria-label={`Avancement ${progressPercent}%`}>
        <span style={{ width: `${progressPercent}%` }} />
      </div>

      <ol className="document-workflow-stepper__steps">
        {steps.map((step, index) => (
          <li
            className={`document-workflow-card document-workflow-card--${step.status}${
              step.id === activeStepId ? ' document-workflow-card--active' : ''
            }`}
            key={step.id}
          >
            <button
              type="button"
              className="document-workflow-card__selector"
              onClick={() => onStepSelect(step.id)}
              aria-current={step.id === activeStepId ? 'step' : undefined}
            >
              <span className="document-workflow-card__number">{index + 1}</span>
              <span className="document-workflow-card__status">{statusLabels[step.status]}</span>
              <strong>{step.label}</strong>
            </button>
            <p>{step.explanation}</p>
            <div className="document-workflow-card__actions">
              <button type="button" onClick={step.primaryAction.onClick} disabled={step.primaryAction.disabled}>
                {step.primaryAction.label}
              </button>
              <button
                type="button"
                className="document-workflow-card__secondary"
                onClick={step.secondaryAction.onClick}
                disabled={step.secondaryAction.disabled}
              >
                {step.secondaryAction.label}
              </button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
