import type { AnnualPlanning, PlanningCycle } from "../../types/planning";
import { duplicateCycle } from "../../lib/planning/planningEngine";
import { PlanningCycleCard } from "./PlanningCycleCard";

type PlanningAnnualViewProps = {
  planning: AnnualPlanning;
  onChange: (planning: AnnualPlanning) => void;
  readOnly?: boolean;
};

export function PlanningAnnualView({ planning, onChange, readOnly }: PlanningAnnualViewProps) {
  function updateCycle(cycle: PlanningCycle) {
    if (readOnly) return;
    onChange({
      ...planning,
      cycles: planning.cycles.map((item) => item.id === cycle.id ? cycle : item),
      updatedAt: new Date().toISOString(),
    });
  }

  function handleDuplicate(cycle: PlanningCycle) {
    if (readOnly) return;
    const lastWeek = Math.max(...planning.cycles.map((item) => item.endWeek), 0);
    onChange({
      ...planning,
      cycles: [...planning.cycles, duplicateCycle(cycle, lastWeek + 1)],
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <section className="planning-annual-view">
      <div className="planning-section-title">
        <span>Plan annuel</span>
        <h2>Cycles et semaines modifiables</h2>
      </div>
      {planning.cycles.map((cycle) => (
        <PlanningCycleCard
          key={cycle.id}
          cycle={cycle}
          onChange={updateCycle}
          onDuplicate={() => handleDuplicate(cycle)}
          readOnly={readOnly}
        />
      ))}
    </section>
  );
}
