type DocumentWorkflowStep = {
  id: string
  label: string
  detail?: string
}

type DocumentWorkflowNavProps = {
  steps: DocumentWorkflowStep[]
  activeStep: string
  onStepChange: (stepId: string) => void
}

export function DocumentWorkflowNav({ steps, activeStep, onStepChange }: DocumentWorkflowNavProps) {
  return (
    <nav className="document-workflow-nav no-print" aria-label="Navigation secondaire du document">
      {steps.map((step) => (
        <a
          key={step.id}
          href={`#${step.id}`}
          className={`document-workflow-nav__step${activeStep === step.id ? ' document-workflow-nav__step--active' : ''}`}
          onClick={() => onStepChange(step.id)}
        >
          <span>{step.label}</span>
          {step.detail && <small>{step.detail}</small>}
        </a>
      ))}
    </nav>
  )
}
