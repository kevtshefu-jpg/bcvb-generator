import type { EvaluationCriterion, EvaluationPlayer, PlayerEvaluation } from "../../types/evaluations";
import { computePlayerEvaluationSummary } from "../../lib/evaluations/evaluationScoring";
import { evaluationDomainLabels } from "../../lib/evaluations/evaluationTemplates";

export function EvaluationPlayerCard({
  player,
  evaluation,
  criteria,
  selected,
  onSelect,
}: {
  player: EvaluationPlayer;
  evaluation?: PlayerEvaluation;
  criteria: EvaluationCriterion[];
  selected?: boolean;
  onSelect: () => void;
}) {
  const summary = evaluation ? computePlayerEvaluationSummary(evaluation, criteria) : null;
  const strengths = summary?.strongestDomains.slice(0, 2).map((domain) => evaluationDomainLabels[domain]) || [];
  const priorities = summary?.priorityDomains.slice(0, 2).map((domain) => evaluationDomainLabels[domain]) || [];

  return (
    <article className={`evaluation-player-card ${selected ? "is-selected" : ""}`}>
      <div>
        <strong>{player.firstName} {player.lastName}</strong>
        <span>{player.position || "Poste à préciser"} · présence {player.attendanceRate ?? 0}%</span>
      </div>
      <strong className="evaluation-player-card__score">{summary ? `${summary.globalScore}/5` : "À faire"}</strong>
      <p>Fort : {strengths.join(", ") || "à identifier"}</p>
      <p>Axe : {priorities.join(", ") || evaluation?.priorityAxis || "à définir"}</p>
      <p>{evaluation?.coachComment || evaluation?.globalComment || "Pas encore de commentaire coach."}</p>
      <button type="button" onClick={onSelect}>{selected ? "Ouvert" : "Évaluer"}</button>
    </article>
  );
}

