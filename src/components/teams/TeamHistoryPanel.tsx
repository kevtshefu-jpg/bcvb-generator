import { useMemo, useState } from "react";
import type { TeamSeasonHistory } from "../../types/teams";
import { downloadTeamFile } from "../../lib/teams/teamExports";

export function TeamHistoryPanel({
  history,
  canArchive,
}: {
  history: TeamSeasonHistory[];
  canArchive: boolean;
}) {
  const [seasonFilter, setSeasonFilter] = useState("all");
  const [localHistory, setLocalHistory] = useState(history);
  const seasons = useMemo(() => [...new Set(localHistory.map((item) => item.season))], [localHistory]);
  const visibleHistory = seasonFilter === "all" ? localHistory : localHistory.filter((item) => item.season === seasonFilter);

  function addNote() {
    setLocalHistory([
      {
        id: `history-note-${Date.now()}`,
        teamId: localHistory[0]?.teamId || "team",
        season: seasons[0] || new Date().getFullYear().toString(),
        summary: "Note staff à compléter : point de situation, décision ou fait marquant.",
        finalLevel: "Note interne",
        strengths: ["À compléter"],
        priorities: ["À compléter"],
      },
      ...localHistory,
    ]);
  }

  function exportHistory() {
    downloadTeamFile("historique-equipe-bcvb.json", JSON.stringify(visibleHistory, null, 2), "application/json;charset=utf-8");
  }

  return (
    <section className="team-history-panel">
      <div className="teams-section-title">
        <span>Historique</span>
        <h2>Mémoire sportive par saison</h2>
      </div>
      <div className="team-doc-toolbar">
        <select value={seasonFilter} onChange={(event) => setSeasonFilter(event.target.value)}>
          <option value="all">Toutes saisons</option>
          {seasons.map((season) => <option key={season}>{season}</option>)}
        </select>
        <button type="button" onClick={addNote}>Ajouter note</button>
        <button type="button" onClick={exportHistory}>Exporter historique</button>
      </div>
      <div className="team-history-actions">
        <button type="button" disabled={!canArchive} onClick={() => window.alert("Archivage préparé : utiliser le panneau d’archivage sécurisé sous l’historique.")}>Archiver saison</button>
        <button type="button" onClick={() => window.alert("Comparaison préparée sur les deux dernières saisons visibles.")}>Comparer deux saisons</button>
        <button type="button" onClick={() => downloadTeamFile("bilan-fin-saison-bcvb.txt", visibleHistory.map((item) => `${item.season}\n${item.summary}`).join("\n\n"))}>Créer bilan fin de saison</button>
      </div>
      <div className="team-history-list">
        {visibleHistory.map((item) => (
          <article key={item.id}>
            <span>{item.season}</span>
            <h3>{item.finalLevel || "Niveau final à renseigner"}</h3>
            <p>{item.summary}</p>
            <div>
              <strong>Staff</strong>
              <p>{item.staff?.join(", ") || "Non renseigné"}</p>
              <strong>Points forts</strong>
              <p>{item.strengths?.join(", ") || "À compléter"}</p>
              <strong>Axes</strong>
              <p>{item.priorities?.join(", ") || "À compléter"}</p>
            </div>
          </article>
        ))}
        {visibleHistory.length === 0 && <p>Aucun historique disponible.</p>}
      </div>
    </section>
  );
}
