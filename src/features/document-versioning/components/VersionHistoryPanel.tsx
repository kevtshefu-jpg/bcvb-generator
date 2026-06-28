import type { DocumentVersion } from "../types/version.types";
import { downloadSource } from "../services/documentVersionService";
import { EmptyState } from "../../../components/ui/ResponsiveDataView";

type VersionHistoryPanelProps = {
  versions: DocumentVersion[];
  onRestore: (version: DocumentVersion) => void;
};

export default function VersionHistoryPanel({ versions, onRestore }: VersionHistoryPanelProps) {
  return (
    <section className="version-history-panel no-print">
      <header>
        <p className="bcvb-eyebrow">Version source</p>
        <h2>Historique documentaire</h2>
      </header>

      {versions.length === 0 ? (
        <EmptyState
          title="Aucune version enregistrée"
          description="Les sauvegardes apparaîtront ici après une restauration, une republication ou une évolution du document source."
        />
      ) : (
        <div className="version-history-list">
          {versions.map((version) => (
            <article key={version.id}>
              <div>
                <strong>Version {version.version}</strong>
                <span>{new Date(version.createdAt).toLocaleString("fr-FR")}</span>
                <em>Score {version.qualityScore?.globalScore ?? "—"}/100</em>
              </div>
              {version.changeLog.length > 0 && (
                <ul>
                  {version.changeLog.slice(0, 3).map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              )}
              <div className="version-history-actions">
                <button type="button" onClick={() => onRestore(version)}>
                  Restaurer
                </button>
                <button type="button" onClick={() => downloadSource(version.documentId, version.content_source)}>
                  Source
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
