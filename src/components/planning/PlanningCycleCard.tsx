import type { CycleStatus, PlanningCycle, PlanningWeek } from "../../types/planning";
import { PlanningWeekRow } from "./PlanningWeekRow";

type PlanningCycleCardProps = {
  cycle: PlanningCycle;
  onChange: (cycle: PlanningCycle) => void;
  onDuplicate: () => void;
  readOnly?: boolean;
};

const cycleStatuses: CycleStatus[] = ["brouillon", "en cours", "validé", "verrouillé"];

export function PlanningCycleCard({ cycle, onChange, onDuplicate, readOnly }: PlanningCycleCardProps) {
  const locked = Boolean(readOnly || cycle.locked || cycle.status === "verrouillé");

  function updateWeek(week: PlanningWeek) {
    onChange({
      ...cycle,
      weeks: cycle.weeks.map((item) => item.id === week.id ? week : item),
    });
  }

  return (
    <article className={`planning-cycle-card ${locked ? "is-locked" : ""}`}>
      <header>
        <div>
          <span>Semaines {cycle.startWeek}-{cycle.endWeek}</span>
          <input disabled={locked} value={cycle.title} onChange={(event) => onChange({ ...cycle, title: event.target.value })} />
        </div>
        <div className="planning-cycle-actions">
          <select disabled={readOnly} value={cycle.status} onChange={(event) => onChange({ ...cycle, status: event.target.value as CycleStatus, locked: event.target.value === "verrouillé" })}>
            {cycleStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
          {!readOnly && <button type="button" onClick={() => onChange({ ...cycle, locked: !cycle.locked, status: !cycle.locked ? "verrouillé" : "brouillon" })}>{locked ? "Déverrouiller" : "Verrouiller"}</button>}
          {!readOnly && <button type="button" onClick={onDuplicate}>Dupliquer</button>}
        </div>
      </header>

      <div className="planning-cycle-meta">
        <label>
          Thème
          <input disabled={locked} value={cycle.theme} onChange={(event) => onChange({ ...cycle, theme: event.target.value })} />
        </label>
        <label>
          Priorité BCVB
          <input disabled={locked} value={cycle.bcvbPriority} onChange={(event) => onChange({ ...cycle, bcvbPriority: event.target.value })} />
        </label>
      </div>

      <div className="planning-table-scroll">
        <table className="planning-week-table">
          <thead>
            <tr>
              {["Semaine", "Thème", "Priorité", "Objectifs", "Critères", "Séances", "Note coach", "Note RT"].map((header) => <th key={header}>{header}</th>)}
            </tr>
          </thead>
          <tbody>
            {cycle.weeks.map((week) => <PlanningWeekRow key={week.id} week={week} locked={locked} onChange={updateWeek} />)}
          </tbody>
        </table>
      </div>
    </article>
  );
}
