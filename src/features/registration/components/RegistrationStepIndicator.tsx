type RegistrationStepIndicatorProps = {
  steps: string[]
  currentStep: number
}

export default function RegistrationStepIndicator({
  steps,
  currentStep,
}: RegistrationStepIndicatorProps) {
  return (
    <ol className="registration-step-indicator" aria-label="Étapes de la demande">
      {steps.map((step, index) => {
        const stateClass =
          index === currentStep
            ? 'registration-step-indicator__item--active'
            : index < currentStep
              ? 'registration-step-indicator__item--done'
              : ''

        return (
          <li
            className={`registration-step-indicator__item ${stateClass}`}
            key={step}
            aria-current={index === currentStep ? 'step' : undefined}
          >
            <span>{index + 1}</span>
            <strong>{step}</strong>
          </li>
        )
      })}
    </ol>
  )
}
