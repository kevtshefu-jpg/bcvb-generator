import type { TutorialItem } from "../../types/tutorials";

type TutorialStepListProps = {
  tutorial: TutorialItem;
  completedStepIds: string[];
  onToggleStep: (stepId: string, done: boolean) => void;
};

export default function TutorialStepList({ tutorial, completedStepIds, onToggleStep }: TutorialStepListProps) {
  return (
    <section className="tutorial-detail-card">
      <div className="tutorial-section-heading">
        <p>Parcours guidé</p>
        <h2>Étapes opérationnelles</h2>
      </div>

      <ol className="tutorial-step-list">
        {tutorial.steps.map((step, index) => {
          const checked = completedStepIds.includes(step.id);

          return (
            <li key={step.id} className={checked ? "tutorial-step tutorial-step--done" : "tutorial-step"}>
              <button
                type="button"
                className="tutorial-step__toggle"
                onClick={() => onToggleStep(step.id, !checked)}
                aria-label={checked ? "Marquer l’étape comme à faire" : "Marquer l’étape comme terminée"}
              >
                {checked ? "✓" : index + 1}
              </button>

              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                {step.expectedResult && <span className="tutorial-step__result">{step.expectedResult}</span>}
                {step.warning && <span className="tutorial-step__warning">{step.warning}</span>}
                {step.actionLabel && <span className="tutorial-step__action">{step.actionLabel}</span>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
