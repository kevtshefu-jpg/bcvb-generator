import type { EvaluationDomain } from "../../types/evaluations";
import { evaluationDomainLabels } from "../../lib/evaluations/evaluationTemplates";

export function EvaluationDomainScore({
  domain,
  score,
}: {
  domain: EvaluationDomain;
  score: number;
}) {
  const tone = score >= 4 ? "elite" : score >= 3 ? "success" : score > 0 ? "warning" : "neutral";

  return (
    <article className={`evaluation-domain-score evaluation-domain-score--${tone}`}>
      <span>{evaluationDomainLabels[domain]}</span>
      <strong>{score ? `${score}/5` : "—"}</strong>
    </article>
  );
}

