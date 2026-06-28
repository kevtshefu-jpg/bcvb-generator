import type { AnnualPlanning } from "../../types/planning";
import type { DirigeantPlanningSummary } from "../../types/dirigeants";
import { EmptyState, MobileDetailCard, ResponsiveDataList, StatusBadge } from "../ui/ResponsiveDataView";

type ComparisonStatus = "non démarré" | "en cours" | "réalisé" | "en retard";

function getStatus(planned: number, completed: number): ComparisonStatus {
  if (completed === 0) return "non démarré";
  if (completed >= planned) return "réalisé";
  if (completed / Math.max(planned, 1) < 0.45) return "en retard";
  return "en cours";
}

export function PlanningComparisonPanel({
  planning,
  summary,
}: {
  planning: AnnualPlanning;
  summary?: DirigeantPlanningSummary;
}) {
  const rows = planning.globalObjectives.map((objective, index) => {
    const plannedSessions = Math.max(2, Math.round(planning.trainingFrequencyPerWeek * 2));
    const completedSessions = Math.min(plannedSessions, Math.max(0, (summary?.completedSessionsCount || index) - index));
    const status = getStatus(plannedSessions, completedSessions);

    return {
      id: objective.id,
      objective: objective.label,
      plannedSessions,
      completedSessions,
      indicator: objective.quantifiableCriteria[0] || "Indicateur à préciser",
      status,
      technicalComment: objective.observableCriteria[0] || "Observable à consolider avec le staff.",
      action:
        status === "réalisé"
          ? "Capitaliser et documenter."
          : status === "en retard"
            ? "Demander un point coach / responsable technique."
            : "Suivre au prochain cycle.",
    };
  });

  return (
    <section className="planning-card dirigeant-readonly-panel">
      <div className="planning-section-title">
        <span>Objectifs / réalisé</span>
        <h2>Comparatif commission sportive</h2>
      </div>

      <div className="planning-table-scroll responsive-data-table">
        <table className="planning-week-table planning-comparison-table">
          <thead>
            <tr>
              <th>Objectif prévu</th>
              <th>Séances prévues</th>
              <th>Séances réalisées</th>
              <th>Indicateur</th>
              <th>Statut</th>
              <th>Commentaire technique</th>
              <th>Action recommandée</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.objective}</td>
                <td>{row.plannedSessions}</td>
                <td>{row.completedSessions}</td>
                <td>{row.indicator}</td>
                <td><span className={`planning-progress-status planning-progress-status--${row.status.replace(/\s/g, "-")}`}>{row.status}</span></td>
                <td>{row.technicalComment}</td>
                <td>{row.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="responsive-data-mobile">
        <ResponsiveDataList
          empty={<EmptyState title="Aucun objectif prévu" description="Les objectifs annuels alimenteront ce comparatif." />}
        >
          {rows.map((row) => (
            <MobileDetailCard
              key={row.id}
              tone={row.status === "en retard" ? "is-warning" : row.status === "réalisé" ? "is-valid" : undefined}
              eyebrow="Objectif prévu"
              title={row.objective}
              badge={<StatusBadge tone={row.status === "en retard" ? "warning" : row.status === "réalisé" ? "success" : "info"}>{row.status}</StatusBadge>}
              items={[
                { label: "Séances prévues", value: row.plannedSessions },
                { label: "Réalisées", value: row.completedSessions },
                { label: "Indicateur", value: row.indicator, full: true },
                { label: "Commentaire", value: row.technicalComment, full: true },
                { label: "Action", value: row.action, full: true },
              ]}
            />
          ))}
        </ResponsiveDataList>
      </div>
    </section>
  );
}
