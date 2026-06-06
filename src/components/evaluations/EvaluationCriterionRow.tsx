import type { EvaluationCriterion, EvaluationScore, PlayerEvaluationScore } from "../../types/evaluations";
import { evaluationDomainLabels } from "../../lib/evaluations/evaluationTemplates";
import { getEvaluationScoreLabel, getEvaluationScoreTone } from "../../lib/evaluations/evaluationScoring";

const scores: EvaluationScore[] = [1, 2, 3, 4, 5];

export function EvaluationCriterionRow({
  criterion,
  value,
  disabled,
  onChange,
}: {
  criterion: EvaluationCriterion;
  value: PlayerEvaluationScore;
  disabled?: boolean;
  onChange: (score: PlayerEvaluationScore) => void;
}) {
  return (
    <tr className="evaluation-criterion-row">
      <td><span>{evaluationDomainLabels[criterion.domain]}</span></td>
      <td>
        <strong>{criterion.label}</strong>
        <p>{criterion.description}</p>
      </td>
      <td>{criterion.observable}</td>
      <td>
        <div className="evaluation-score-buttons">
          {scores.map((score) => (
            <button
              key={score}
              type="button"
              disabled={disabled}
              className={`evaluation-score-button evaluation-score-button--${getEvaluationScoreTone(score)} ${value.score === score ? "is-active" : ""}`}
              title={getEvaluationScoreLabel(score)}
              onClick={() => onChange({ ...value, score })}
            >
              {score}
            </button>
          ))}
        </div>
      </td>
      <td>
        <input
          disabled={disabled}
          value={value.comment || ""}
          onChange={(event) => onChange({ ...value, comment: event.target.value })}
          placeholder="Commentaire coach"
        />
      </td>
      <td>
        <input
          disabled={disabled}
          value={value.observableEvidence || ""}
          onChange={(event) => onChange({ ...value, observableEvidence: event.target.value })}
          placeholder="Preuve terrain"
        />
      </td>
    </tr>
  );
}

