import type { DirectorPlanningOverview as DirectorPlanningOverviewType } from "../../types/directors";
import { DirectorStatusBadge } from "./DirectorStatusBadge";

export function DirectorPlanningOverview({ plannings }: { plannings: DirectorPlanningOverviewType[] }) {
  function exportSummary() {
    const rows = [
      "equipe;categorie;saison;cycle;objectifs;seances;avancement;statut",
      ...plannings.map((planning) => [
        planning.teamName,
        planning.category,
        planning.season,
        planning.currentCycle || "",
        planning.objectivesCount,
        planning.linkedSessionsCount,
        `${planning.completionRate || 0}%`,
        planning.status,
      ].join(";")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([rows], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "synthese-planifications-dirigeants.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="director-card">
      <div className="director-card__header">
        <div>
          <span>Suivi planifications</span>
          <h2>Lecture seule des plans sportifs</h2>
        </div>
        <button type="button" onClick={exportSummary}>Exporter synthèse</button>
      </div>

      <div className="director-table-scroll">
        <table className="director-table">
          <thead>
            <tr>
              <th>Équipe</th>
              <th>Catégorie</th>
              <th>Saison</th>
              <th>Cycle actuel</th>
              <th>Objectifs</th>
              <th>Séances liées</th>
              <th>Avancement</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {plannings.map((planning) => (
              <tr key={planning.id}>
                <td>{planning.teamName}</td>
                <td>{planning.category}</td>
                <td>{planning.season}</td>
                <td>{planning.currentCycle || "À définir"}</td>
                <td>{planning.objectivesCount}</td>
                <td>{planning.linkedSessionsCount}</td>
                <td>{planning.completionRate ?? 0}%</td>
                <td><DirectorStatusBadge status={planning.status} /></td>
                <td><a href="/club/planifications">Consulter</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
