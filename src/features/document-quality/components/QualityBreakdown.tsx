import type { QualityScore } from "../types/quality.types";
import { buildQualityDecisionItems } from "../services/qualityDecisionView";

type QualityBreakdownProps = {
  score: QualityScore;
};

export default function QualityBreakdown({ score }: QualityBreakdownProps) {
  const items = buildQualityDecisionItems(score);

  return (
    <div className="quality-breakdown">
      {items.map((item) => {
        return (
          <article key={item.key} className="quality-breakdown__row">
            <header>
              <span>{item.label}</span>
              <strong>{item.value}/100</strong>
            </header>
            <div className="quality-breakdown__bar" aria-label={`${item.label} ${item.value}/100`}>
              <span style={{ width: `${item.value}%` }} />
            </div>
            <p>{item.label} : {item.value}/100 — {item.explanation}</p>
            <button type="button">{item.action}</button>
          </article>
        );
      })}
    </div>
  );
}
