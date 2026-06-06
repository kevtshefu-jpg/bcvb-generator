import type { RosterImportResult, RosterQualityScore } from "../../types/roster";

export function RosterDashboard({
  result,
  quality,
}: {
  result: RosterImportResult | null;
  quality: RosterQualityScore;
}) {
  return (
    <section className="bcvb-grid-4 roster-stats">
      <article className="bcvb-tool-card">
        <span className="bcvb-status-pill">Joueurs</span>
        <h3>{quality.playerCount}</h3>
      </article>
      <article className="bcvb-tool-card">
        <span className="bcvb-status-pill">Score qualité</span>
        <h3>{quality.score}%</h3>
      </article>
      <article className="bcvb-tool-card">
        <span className="bcvb-status-pill">Lignes en erreur</span>
        <h3>{quality.errorRows}</h3>
      </article>
      <article className="bcvb-tool-card">
        <span className="bcvb-status-pill">Fichier</span>
        <h3>{result?.fileName || "Aucun"}</h3>
      </article>
    </section>
  );
}

