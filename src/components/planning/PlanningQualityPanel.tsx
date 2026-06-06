import type { AnnualPlanning } from "../../types/planning";
import { scorePlanning } from "../../lib/planning/planningScoring";

export function PlanningQualityPanel({ planning }: { planning: AnnualPlanning }) {
  const report = scorePlanning(planning);

  return (
    <aside className="planning-side-card">
      <div className="planning-section-title">
        <span>Qualité</span>
        <h2>{report.score}/100</h2>
      </div>
      <p className={report.publishable ? "planning-ok" : "planning-warning"}>
        {report.publishable ? "Plan publiable après validation." : "Plan à consolider avant diffusion."}
      </p>
      <h3>Forces</h3>
      <ul>{report.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
      <h3>Alertes</h3>
      <ul>{report.warnings.map((item) => <li key={item}>{item}</li>)}</ul>
      <h3>Priorités</h3>
      <ul>{report.priorities.map((item) => <li key={item}>{item}</li>)}</ul>
    </aside>
  );
}
