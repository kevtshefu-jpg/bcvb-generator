import type { EvaluationCriterion, PlayerEvaluation } from "../../types/evaluations";
import { computePlayerEvaluationSummary } from "../../lib/evaluations/evaluationScoring";

export function EvaluationHistoryTimeline({
  evaluations,
  criteria,
}: {
  evaluations: PlayerEvaluation[];
  criteria: EvaluationCriterion[];
}) {
  return (
    <aside className="evaluation-card evaluation-history-timeline">
      <div className="evaluations-section-title">
        <span>Historique</span>
        <h2>Progression annuelle</h2>
      </div>
      <div className="evaluation-history-list">
        {evaluations.map((evaluation) => {
          const summary = computePlayerEvaluationSummary(evaluation, criteria);
          return (
            <article key={evaluation.id}>
              <strong>{evaluation.period} · {summary.globalScore}/5</strong>
              <span>{new Date(evaluation.updatedAt).toLocaleDateString("fr-FR")}</span>
              <p>{evaluation.coachComment || evaluation.globalComment || "Commentaire à compléter"}</p>
            </article>
          );
        })}
        {evaluations.length === 0 && <p>Aucune évaluation enregistrée pour ce joueur.</p>}
      </div>
    </aside>
  );
}
