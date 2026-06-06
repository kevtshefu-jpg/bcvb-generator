import type { RosterQualityScore } from "../../types/roster";

export function RosterQualityPanel({ quality }: { quality: RosterQualityScore }) {
  return (
    <aside className="bcvb-tool-card roster-quality-panel">
      <div className="roster-section-header">
        <div>
          <span>Qualité effectif</span>
          <h2>{quality.score}/100</h2>
        </div>
      </div>
      <div className="roster-quality-ring" style={{ ["--score" as string]: `${quality.score}%` }}>
        <strong>{quality.score}%</strong>
      </div>
      <dl className="roster-profile-list">
        <div><dt>Joueurs</dt><dd>{quality.playerCount}</dd></div>
        <div><dt>Sans équipe</dt><dd>{quality.playersWithoutTeam}</dd></div>
        <div><dt>Sans contact</dt><dd>{quality.playersWithoutContact}</dd></div>
        <div><dt>Doublons probables</dt><dd>{quality.probableDuplicates}</dd></div>
        <div><dt>Lignes importées</dt><dd>{quality.importedRows}</dd></div>
        <div><dt>Lignes en erreur</dt><dd>{quality.errorRows}</dd></div>
      </dl>
      <h3>Actions recommandées</h3>
      <ul>
        {quality.actions.map((action) => <li key={action}>{action}</li>)}
      </ul>
    </aside>
  );
}

