import type { IndividualObjective } from "../../types/evaluations";
import { PlayerProgressPlan } from "./PlayerProgressPlan";

const examples = [
  "Communiquer sur chaque écran direct.",
  "Finir les contre-attaques main extérieure.",
  "Tenir 3 stops défensifs consécutifs.",
  "Prendre au moins 3 tirs ouverts créés par démarquage.",
  "Réussir 8/10 lancers francs en fin de séance.",
];

export function EvaluationObjectivesPanel({
  objective,
  playerId,
  disabled,
  onChange,
}: {
  objective?: IndividualObjective;
  playerId: string;
  disabled?: boolean;
  onChange: (objective: IndividualObjective) => void;
}) {
  return (
    <section className="evaluation-objectives-panel">
      <PlayerProgressPlan objective={objective} playerId={playerId} disabled={disabled} onChange={onChange} />
      <section className="evaluation-card evaluation-objective-suggestions">
        <div className="evaluations-section-title">
          <span>Objectifs guidés</span>
          <h2>Challenges terrain</h2>
        </div>
        <div className="evaluation-pill-list">
          {examples.map((example) => <span key={example}>{example}</span>)}
        </div>
      </section>
    </section>
  );
}

