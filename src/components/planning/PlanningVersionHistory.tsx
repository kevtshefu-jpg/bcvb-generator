import type { PlanningVersion } from "../../types/planning";

export function PlanningVersionHistory({ versions }: { versions: PlanningVersion[] }) {
  return (
    <aside className="planning-side-card">
      <div className="planning-section-title">
        <span>Versions</span>
        <h2>Historique</h2>
      </div>
      {versions.length === 0 ? (
        <p className="planning-muted">Aucune version sauvegardée pour le moment.</p>
      ) : (
        <ol className="planning-version-list">
          {versions.map((version) => (
            <li key={version.id}>
              <strong>{new Date(version.createdAt).toLocaleDateString("fr-FR")}</strong>
              <span>{version.createdBy}</span>
              <p>{version.comment}</p>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
