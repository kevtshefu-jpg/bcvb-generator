import type { DirigeantDocumentSummary, DirigeantPlanningSummary } from "../../types/dirigeants";

export function DirigeantQualityPanel({
  plannings,
  documents,
}: {
  plannings: DirigeantPlanningSummary[];
  documents: DirigeantDocumentSummary[];
}) {
  const qualityRows = [
    ...plannings.map((planning) => ({
      id: planning.id,
      label: planning.teamName,
      type: "Planification",
      score: planning.qualityScore,
      status: planning.qualityScore >= 78 ? "Publiable" : "À corriger",
      action: planning.qualityScore >= 78 ? "Suivre validation" : "Demander correction technique",
    })),
    ...documents.map((document) => ({
      id: document.id,
      label: document.title,
      type: document.family,
      score: document.qualityScore,
      status: document.qualityScore >= 78 ? "Publiable" : "À corriger",
      action: document.qualityScore >= 78 ? "Ouvrir pour validation" : "Demander correction documentaire",
    })),
  ].sort((a, b) => a.score - b.score);

  return (
    <section className="dirigeant-section" id="qualite-documentaire">
      <div className="dirigeant-section__title">
        <span>Qualité documentaire</span>
        <h2>Documents publiables ou à corriger</h2>
      </div>

      <div className="dirigeant-quality-list">
        {qualityRows.slice(0, 8).map((row) => (
          <article key={row.id} className="dirigeant-quality-row">
            <div>
              <span>{row.type}</span>
              <strong>{row.label}</strong>
            </div>
            <div className="dirigeant-quality-meter" aria-label={`Score ${row.score} sur 100`}>
              <span style={{ width: `${row.score}%` }} />
            </div>
            <b>{row.score}/100</b>
            <em>{row.status}</em>
            <small>{row.action}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
