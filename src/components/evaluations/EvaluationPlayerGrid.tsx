import type { EvaluationCriterion, PlayerEvaluation } from "../../types/evaluations";
import { EvaluationGrid } from "./EvaluationGrid";

export function EvaluationPlayerGrid({
  criteria,
  evaluation,
  disabled,
  onChange,
}: {
  criteria: EvaluationCriterion[];
  evaluation: PlayerEvaluation;
  disabled?: boolean;
  onChange: (evaluation: PlayerEvaluation) => void;
}) {
  function patch(patchEvaluation: Partial<PlayerEvaluation>) {
    onChange({
      ...evaluation,
      ...patchEvaluation,
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <section className="evaluation-player-grid">
      <EvaluationGrid criteria={criteria} evaluation={evaluation} disabled={disabled} onChange={onChange} />
      <section className="evaluation-card evaluation-player-actions">
        <div className="evaluations-section-title">
          <span>Conclusion joueur</span>
          <h2>Du score vers l’action</h2>
        </div>
        <div className="evaluation-player-grid__fields">
          <label>
            Points forts
            <input
              disabled={disabled}
              value={evaluation.strengths.join(", ")}
              onChange={(event) => patch({ strengths: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })}
              placeholder="Ex : intensité, défense H-H"
            />
          </label>
          <label>
            Axe prioritaire
            <input
              disabled={disabled}
              value={evaluation.priorityAxis || evaluation.priorities[0] || ""}
              onChange={(event) => patch({ priorityAxis: event.target.value, priorities: event.target.value ? [event.target.value] : [] })}
              placeholder="Ex : communiquer sur écrans"
            />
          </label>
          <label>
            Challenge du mois
            <input
              disabled={disabled}
              value={evaluation.monthlyChallenge || ""}
              onChange={(event) => patch({ monthlyChallenge: event.target.value })}
              placeholder="Ex : tenir 3 stops défensifs consécutifs"
            />
          </label>
          <label>
            Prochaine étape
            <input
              disabled={disabled}
              value={evaluation.nextStep || ""}
              onChange={(event) => patch({ nextStep: event.target.value })}
              placeholder="Ex : relier à la séance défense H-H"
            />
          </label>
          <label className="evaluation-player-grid__wide">
            Commentaire global
            <textarea
              disabled={disabled}
              value={evaluation.globalComment || evaluation.coachComment}
              onChange={(event) => patch({ globalComment: event.target.value, coachComment: event.target.value })}
            />
          </label>
        </div>
      </section>
    </section>
  );
}

