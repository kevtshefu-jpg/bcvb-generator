import { useMemo, useState } from "react";
import type { DocumentVersion } from "../types/version.types";
import { compareVersions, downloadSource, summarizeVersionDiff } from "../services/documentVersionService";

type VersionHistoryPanelProps = {
  versions: DocumentVersion[];
  onRestore: (version: DocumentVersion) => void;
};

export default function VersionHistoryPanel({ versions, onRestore }: VersionHistoryPanelProps) {
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null);
  const latestVersion = versions.find((version) => version.isLatestVersion) ?? versions[0];
  const comparedVersion = versions.find((version) => version.id === compareVersionId);
  const diff = useMemo(
    () => (latestVersion && comparedVersion ? compareVersions(comparedVersion, latestVersion) : []),
    [comparedVersion, latestVersion]
  );
  const diffSummary = useMemo(() => summarizeVersionDiff(diff), [diff]);

  return (
    <section className="version-history-panel no-print">
      <header>
        <div>
          <p className="bcvb-eyebrow">Version source</p>
          <h2>Historique documentaire</h2>
        </div>
        {latestVersion && <span>Dernière version : v{latestVersion.version}</span>}
      </header>

      {versions.length === 0 ? (
        <p className="version-history-panel__empty">Aucune version enregistrée pour ce document.</p>
      ) : (
        <div className="version-history-list">
          {versions.map((version) => (
            <article key={version.id}>
              <div>
                <strong>
                  Version {version.version}
                  {version.isLatestVersion ? " · actuelle" : ""}
                </strong>
                <span>{new Date(version.createdAt).toLocaleString("fr-FR")}</span>
                <em>Score {version.qualityScore?.globalScore ?? "—"}/100</em>
                <em>{version.snapshot.sourceSize} caractères source · {version.snapshot.savedReason}</em>
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
                <button
                  type="button"
                  onClick={() => downloadSource(version.documentId, version.content_source, `v${version.version}`)}
                >
                  Source
                </button>
                {latestVersion && latestVersion.id !== version.id && (
                  <button type="button" onClick={() => setCompareVersionId(version.id)}>
                    Comparer
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {comparedVersion && latestVersion && (
        <div className="version-diff-panel">
          <strong>Comparaison v{comparedVersion.version} → v{latestVersion.version}</strong>
          <div className="version-diff-summary">
            <span>+{diffSummary.added} lignes</span>
            <span>{diffSummary.changed} modifiées</span>
            <span>-{diffSummary.removed} supprimées</span>
          </div>
          <pre>
            {diff
              .filter((line) => line.type !== "same")
              .slice(0, 12)
              .map((line) => `${line.lineNumber}. ${line.type}: ${line.after || line.before}`)
              .join("\n") || "Aucune différence détectée."}
          </pre>
          <button type="button" onClick={() => setCompareVersionId(null)}>
            Fermer comparaison
          </button>
        </div>
      )}
    </section>
  );
}
