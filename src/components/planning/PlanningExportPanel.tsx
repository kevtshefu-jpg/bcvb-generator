import type { AnnualPlanning, PlanningStatus } from "../../types/planning";
import { exportPlanningJson, exportPlanningMarkdown, printPlanningPdf } from "../../lib/planning/planningExport";

const statuses: PlanningStatus[] = [
  "brouillon",
  "en construction",
  "proposée",
  "à valider",
  "validée technique",
  "en validation dirigeant",
  "validé",
  "publié",
  "archivé",
];

export function PlanningExportPanel({
  planning,
  onStatusChange,
  onSaveVersion,
  readOnly,
}: {
  planning: AnnualPlanning;
  onStatusChange: (status: PlanningStatus) => void;
  onSaveVersion: () => void;
  readOnly?: boolean;
}) {
  return (
    <aside className="planning-side-card">
      <div className="planning-section-title">
        <span>Exports</span>
        <h2>Commission & staff</h2>
      </div>
      <label>
        Statut
        <select disabled={readOnly} value={planning.status} onChange={(event) => onStatusChange(event.target.value as PlanningStatus)}>
          {statuses.map((status) => <option key={status}>{status}</option>)}
        </select>
      </label>
      {!readOnly && <button type="button" onClick={onSaveVersion}>Sauvegarder version</button>}
      <button type="button" onClick={() => exportPlanningMarkdown(planning)}>Export résumé staff</button>
      <button type="button" onClick={() => exportPlanningJson(planning)}>Export JSON</button>
      <button type="button" onClick={printPlanningPdf}>Export PDF / impression</button>
    </aside>
  );
}
