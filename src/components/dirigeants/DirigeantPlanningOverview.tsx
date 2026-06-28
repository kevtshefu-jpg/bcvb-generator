import { Link } from "react-router-dom";
import type { DirigeantPlanningSummary } from "../../types/dirigeants";
import { EmptyState, MobileDetailCard, ResponsiveDataList, StatusBadge } from "../ui/ResponsiveDataView";
import { PlanningStatusBadge } from "../planning/PlanningStatusBadge";

export function DirigeantPlanningOverview({ plannings }: { plannings: DirigeantPlanningSummary[] }) {
  return (
    <section className="dirigeant-section">
      <div className="dirigeant-section__title">
        <span>Suivi planifications</span>
        <h2>Plans à suivre en commission</h2>
      </div>

      <div className="dirigeant-table-scroll responsive-data-table">
        <table className="dirigeant-table">
          <thead>
            <tr>
              <th>Équipe</th>
              <th>Catégorie</th>
              <th>Niveau</th>
              <th>Coach</th>
              <th>Statut</th>
              <th>Objectifs</th>
              <th>Cycle actuel</th>
              <th>Séances</th>
              <th>Réalisation</th>
              <th>Alertes</th>
              <th>Plan</th>
            </tr>
          </thead>
          <tbody>
            {plannings.map((planning) => (
              <tr key={planning.id}>
                <td>{planning.teamName}</td>
                <td>{planning.category}</td>
                <td>{planning.level}</td>
                <td>{planning.coachName}</td>
                <td><PlanningStatusBadge status={planning.status} /></td>
                <td>{planning.mainObjectives.slice(0, 2).join(" · ")}</td>
                <td>{planning.currentCycle}</td>
                <td>{planning.linkedSessionsCount}</td>
                <td>{planning.realizationRate}%</td>
                <td>{planning.alerts.length || "OK"}</td>
                <td><Link to="/club/planifications">Voir le plan</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="responsive-data-mobile">
        <ResponsiveDataList
          empty={(
            <EmptyState
              title="Aucun plan à suivre"
              description="Les planifications suivies en commission apparaîtront ici."
            />
          )}
        >
          {plannings.map((planning) => (
            <MobileDetailCard
              key={planning.id}
              tone={planning.alerts.length > 0 ? "is-warning" : "is-valid"}
              eyebrow={planning.category}
              title={planning.teamName}
              subtitle={planning.mainObjectives.slice(0, 2).join(" · ") || "Objectifs à préciser"}
              badge={<PlanningStatusBadge status={planning.status} />}
              items={[
                { label: "Niveau", value: planning.level },
                { label: "Coach", value: planning.coachName },
                { label: "Cycle", value: planning.currentCycle },
                { label: "Séances", value: planning.linkedSessionsCount },
                { label: "Réalisation", value: `${planning.realizationRate}%` },
                { label: "Alertes", value: planning.alerts.length ? <StatusBadge tone="warning">{planning.alerts.length}</StatusBadge> : "OK" },
              ]}
              actions={<Link to="/club/planifications">Voir le plan</Link>}
            />
          ))}
        </ResponsiveDataList>
      </div>
    </section>
  );
}
