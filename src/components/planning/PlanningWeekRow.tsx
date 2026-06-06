import type { PlanningWeek } from "../../types/planning";
import { PlanningSessionLinker } from "./PlanningSessionLinker";

type PlanningWeekRowProps = {
  week: PlanningWeek;
  locked?: boolean;
  onChange: (week: PlanningWeek) => void;
};

function splitLines(value: string) {
  return value.split(/\n|;/).map((item) => item.trim()).filter(Boolean);
}

export function PlanningWeekRow({ week, locked, onChange }: PlanningWeekRowProps) {
  return (
    <tr className={locked ? "is-locked" : ""}>
      <td>
        <strong>S{week.weekNumber}</strong>
        <input disabled={locked} value={week.dateLabel || ""} onChange={(event) => onChange({ ...week, dateLabel: event.target.value })} placeholder="Date" />
      </td>
      <td><input disabled={locked} value={week.theme} onChange={(event) => onChange({ ...week, theme: event.target.value })} /></td>
      <td><input disabled={locked} value={week.priority} onChange={(event) => onChange({ ...week, priority: event.target.value })} /></td>
      <td>
        <textarea
          disabled={locked}
          value={week.objectives.map((objective) => objective.label).join("\n")}
          onChange={(event) => {
            const labels = splitLines(event.target.value);
            onChange({
              ...week,
              objectives: labels.map((label, index) => {
                const existing = week.objectives[index] || week.objectives[0];
                return {
                  id: existing?.id || `obj-${week.id}-${index}`,
                  label,
                  priority: existing?.priority || week.priority,
                  description: existing?.description,
                  observableCriteria: existing?.observableCriteria || [`${label} observable en situation`],
                  quantifiableCriteria: existing?.quantifiableCriteria || week.validationCriteria,
                  bcvbLink: existing?.bcvbLink || "ADN BCVB",
                };
              }),
            });
          }}
        />
      </td>
      <td>
        <textarea disabled={locked} value={week.validationCriteria.join("\n")} onChange={(event) => onChange({ ...week, validationCriteria: splitLines(event.target.value) })} />
      </td>
      <td>
        <PlanningSessionLinker linkedSessionIds={week.linkedSessionIds} disabled={locked} onChange={(linkedSessionIds) => onChange({ ...week, linkedSessionIds })} />
      </td>
      <td>
        <textarea disabled={locked} value={week.coachNotes || ""} onChange={(event) => onChange({ ...week, coachNotes: event.target.value })} placeholder="Note coach" />
      </td>
      <td>
        <textarea disabled={locked} value={week.technicalManagerNotes || ""} onChange={(event) => onChange({ ...week, technicalManagerNotes: event.target.value })} placeholder="Note responsable technique" />
      </td>
    </tr>
  );
}
