import type { AnnualPlanning } from "../../types/planning";
import { PlanningAnnualView } from "./PlanningAnnualView";

export function PlanningBuilder({
  planning,
  onChange,
  readOnly,
}: {
  planning: AnnualPlanning;
  onChange: (planning: AnnualPlanning) => void;
  readOnly?: boolean;
}) {
  return <PlanningAnnualView planning={planning} onChange={onChange} readOnly={readOnly} />;
}
