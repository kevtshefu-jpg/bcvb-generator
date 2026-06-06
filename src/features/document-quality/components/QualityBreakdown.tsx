import type { QualityScore } from "../types/quality.types";

type QualityBreakdownProps = {
  score: QualityScore;
};

const rows: Array<[keyof QualityScore, string]> = [
  ["structureScore", "Structure"],
  ["bcvbIdentityScore", "Identité BCVB"],
  ["pedagogicalScore", "Pédagogie"],
  ["fieldUseScore", "Terrain"],
  ["tableScore", "Tableaux"],
  ["situationScore", "Situations"],
  ["diagramScore", "Schémas"],
  ["styleScore", "Style"],
  ["exportReadinessScore", "Export"],
];

export default function QualityBreakdown({ score }: QualityBreakdownProps) {
  return (
    <div className="quality-breakdown">
      {rows.map(([key, label]) => {
        const value = Number(score[key]);
        return (
          <div key={key} className="quality-breakdown__row">
            <span>{label}</span>
            <div aria-label={`${label} ${value}/100`}>
              <i style={{ width: `${value}%` }} />
            </div>
            <strong>{value}</strong>
          </div>
        );
      })}
    </div>
  );
}
