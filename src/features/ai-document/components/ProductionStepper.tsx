type ProductionStepperProps = {
  steps: string[]
  currentStep: number
  onStepClick?: (index: number) => void
}

export function ProductionStepper({
  steps,
  currentStep,
  onStepClick,
}: ProductionStepperProps) {
  return (
    <nav className="ai-studio-stepper" aria-label="Progression du studio documentaire">
      {steps.map((step, index) => {
        const state =
          index < currentStep ? 'complete' : index === currentStep ? 'active' : 'locked'

        return (
          <button
            type="button"
            className={`ai-studio-stepper__item ai-studio-stepper__item--${state}`}
            key={step}
            onClick={() => onStepClick?.(index)}
          >
            <span>{index + 1}</span>
            <strong>{step}</strong>
          </button>
        )
      })}
    </nav>
  )
}
