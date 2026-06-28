import type { EvaluationCriterion, PlayerEvaluation, PlayerEvaluationScore } from "../../types/evaluations";
import { EmptyState, ResponsiveDataList } from "../ui/ResponsiveDataView";
import { EvaluationCriterionCard, EvaluationCriterionRow } from "./EvaluationCriterionRow";

export function EvaluationGrid({
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
  function updateScore(score: PlayerEvaluationScore) {
    onChange({
      ...evaluation,
      scores: evaluation.scores.map((item) => item.criterionId === score.criterionId ? score : item),
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <section className="evaluation-card evaluation-grid">
      <div className="evaluations-section-title">
        <span>Grille joueur</span>
        <h2>Critères BCVB et fondamentaux</h2>
      </div>
      <div className="evaluations-table-scroll responsive-data-table">
        <table className="bcvb-table-premium">
          <thead>
            <tr>
              <th>Domaine</th>
              <th>Critère</th>
              <th>Observable terrain</th>
              <th>Note 1 à 5</th>
              <th>Commentaire coach</th>
              <th>Preuve observable</th>
            </tr>
          </thead>
          <tbody>
            {criteria.map((criterion) => {
              const value = evaluation.scores.find((score) => score.criterionId === criterion.id) || { criterionId: criterion.id, score: 3 as const };
              return (
                <EvaluationCriterionRow
                  key={criterion.id}
                  criterion={criterion}
                  value={value}
                  disabled={disabled}
                  onChange={updateScore}
                />
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="responsive-data-mobile">
        <ResponsiveDataList
          empty={<EmptyState title="Aucun critère d’évaluation" description="Les critères BCVB apparaîtront ici dès qu’un modèle sera chargé." />}
        >
          {criteria.map((criterion) => {
            const value = evaluation.scores.find((score) => score.criterionId === criterion.id) || { criterionId: criterion.id, score: 3 as const };
            return (
              <EvaluationCriterionCard
                key={criterion.id}
                criterion={criterion}
                value={value}
                disabled={disabled}
                onChange={updateScore}
              />
            );
          })}
        </ResponsiveDataList>
      </div>
    </section>
  );
}
