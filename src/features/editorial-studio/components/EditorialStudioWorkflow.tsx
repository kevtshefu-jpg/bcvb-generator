import { editorialStudioWorkflowItems } from '../utils/editorialStudioLabels'

type EditorialStudioWorkflowProps = {
  currentStep?: number
  completedSteps?: number[]
}

export function EditorialStudioWorkflow({
  currentStep = 1,
  completedSteps = [],
}: EditorialStudioWorkflowProps) {
  return (
    <section className="editorial-workflow" aria-label="Parcours documentaire compact">
      {editorialStudioWorkflowItems.map((step, index) => {
        const stepNumber = index + 1
        const isDone = completedSteps.includes(stepNumber)
        const isActive = currentStep === stepNumber

        return (
          <article
            className={[
              'editorial-workflow__step',
              isActive ? 'editorial-workflow__step--active' : '',
              isDone ? 'editorial-workflow__step--done' : '',
            ].filter(Boolean).join(' ')}
            key={step.label}
          >
            <span>{stepNumber}</span>
            <div>
              <strong>{step.label}</strong>
              <p>{step.help}</p>
            </div>
          </article>
        )
      })}
    </section>
  )
}
