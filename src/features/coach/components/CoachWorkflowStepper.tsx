type CoachWorkflowStepperProps = {
  currentStep?: number
  variant: 'session' | 'planning'
}

const sessionSteps = [
  'Cadrer la séance',
  'Choisir l’objectif prioritaire',
  'Construire le déroulé',
  'Vérifier l’intensité et les rotations',
  'Sauvegarder et partager',
]

const planningSteps = [
  'Choisir la période',
  'Fixer les priorités BCVB',
  'Répartir les thèmes',
  'Équilibrer charge et progression',
  'Valider la cohérence',
]

export default function CoachWorkflowStepper({
  currentStep = 1,
  variant,
}: CoachWorkflowStepperProps) {
  const steps = variant === 'session' ? sessionSteps : planningSteps
  const activeStep = Math.max(1, Math.min(currentStep, steps.length))

  return (
    <ol className="coach-workflow-stepper" aria-label="Étapes guidées coach">
      {steps.map((step, index) => {
        const stepNumber = index + 1

        return (
          <li
            className={[
              'coach-workflow-stepper__item',
              stepNumber === activeStep ? 'coach-workflow-stepper__item--active' : '',
            ].filter(Boolean).join(' ')}
            key={step}
          >
            <span className="coach-workflow-stepper__number">{stepNumber}</span>
            <span className="coach-workflow-stepper__label">{step}</span>
          </li>
        )
      })}
    </ol>
  )
}
