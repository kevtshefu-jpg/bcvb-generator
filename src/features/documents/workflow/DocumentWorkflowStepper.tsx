import {
  getStepStatusLabel,
  getWorkflowProgress,
  type DocumentWorkflowStep,
  type DocumentWorkflowStepKey,
} from './documentWorkflow'

type DocumentWorkflowStepperProps = {
  steps: DocumentWorkflowStep[]
  currentStepKey?: DocumentWorkflowStepKey
  compact?: boolean
  onStepClick?: (step: DocumentWorkflowStep) => void
}

export function DocumentWorkflowStepper({
  steps,
  currentStepKey,
  compact = false,
  onStepClick,
}: DocumentWorkflowStepperProps) {
  const progress = getWorkflowProgress(steps)

  return (
    <section
      className={[
        'document-workflow-stepper',
        'document-workflow-stepper--guided',
        compact ? 'document-workflow-stepper--compact' : '',
      ].filter(Boolean).join(' ')}
      aria-label="Parcours guidé du document"
    >
      <div className="document-workflow-stepper__progress" aria-label={`Avancement ${progress}%`}>
        <span style={{ width: `${progress}%` }} />
      </div>

      <ol className="document-workflow-stepper__steps">
        {steps.map((step) => {
          const isCurrent = currentStepKey === step.key || step.status === 'current'
          const content = (
            <>
              <span className="document-workflow-stepper__number">{step.order}</span>
              <span className="document-workflow-stepper__content">
                <span className="document-workflow-stepper__status">
                  {getStepStatusLabel(step.status)}
                </span>
                <strong className="document-workflow-stepper__title">{step.shortTitle}</strong>
                {!compact ? (
                  <span className="document-workflow-stepper__description">{step.description}</span>
                ) : null}
              </span>
            </>
          )

          return (
            <li
              className={[
                'document-workflow-stepper__item',
                `document-workflow-stepper__item--${step.status}`,
                isCurrent ? 'document-workflow-stepper__item--current' : '',
              ].filter(Boolean).join(' ')}
              key={`${step.key}-${step.order}`}
            >
              {onStepClick ? (
                <button
                  type="button"
                  onClick={() => onStepClick(step)}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {content}
                </button>
              ) : (
                <div aria-current={isCurrent ? 'step' : undefined}>
                  {content}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
