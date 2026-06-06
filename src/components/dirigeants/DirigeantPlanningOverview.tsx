import { Link } from "react-router-dom";
import type { DirigeantPlanningSummary } from "../../types/dirigeants";
import { PlanningStatusBadge } from "../planning/PlanningStatusBadge";

export function DirigeantPlanningOverview({ plannings }: { plannings: DirigeantPlanningSummary[] }) {
  return (
    <section className="dirigeant-section">
      <div className="dirigeant-section__title">
        <span>Suivi planifications</span>
        <h2>Plans à suivre en commission</h2>
      </div>

      <div className="dirigeant-table-scroll">
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
    </section>
  );
}
