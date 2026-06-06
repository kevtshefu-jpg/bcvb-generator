import type { AttachmentProcessingResult, AttachmentProgressEvent } from "../../../types/attachments";

type AttachmentProcessingPanelProps = {
  result: AttachmentProcessingResult | null;
  progress: AttachmentProgressEvent | null;
  processing: boolean;
  onReset: () => void;
  onCancel: () => void;
};

const statusLabels: Record<string, string> = {
  uploaded: "Importé",
  detecting: "Détection",
  extracting_text: "Extraction texte",
  ocr_pending: "OCR en attente",
  ocr_processing: "OCR en cours",
  cleaning: "Nettoyage",
  ready: "Prêt",
  low_confidence: "À vérifier",
  error: "Erreur",
};

export default function AttachmentProcessingPanel({
  result,
  progress,
  processing,
  onReset,
  onCancel,
}: AttachmentProcessingPanelProps) {
  const status = progress?.status ?? result?.status ?? "uploaded";
  const progressValue = progress?.progress ?? (result ? 100 : 0);

  return (
    <section className="attachment-processing-panel">
      <header>
        <div>
          <p className="bcvb-eyebrow">Traitement</p>
          <h2>{statusLabels[status] ?? status}</h2>
          <span>{progress?.message ?? result?.warnings[0] ?? "En attente d’un fichier."}</span>
        </div>
        <div className="attachment-processing-panel__actions">
          <button type="button" onClick={onCancel} disabled={!processing}>
            Annuler
          </button>
          <button type="button" onClick={onReset}>
            Réinitialiser
          </button>
        </div>
      </header>

      <div className="attachment-progress" aria-label={`Progression ${progressValue}%`}>
        <span style={{ width: `${progressValue}%` }} />
      </div>

      <div className="attachment-processing-grid">
        <article>
          <span>Type détecté</span>
          <strong>{result?.kind ?? "—"}</strong>
        </article>
        <article>
          <span>Confiance</span>
          <strong>{result ? `${result.confidence}%` : "—"}</strong>
        </article>
        <article>
          <span>Pages</span>
          <strong>{result?.metadata.pageCount ?? "—"}</strong>
        </article>
        <article>
          <span>Mode</span>
          <strong>{result?.metadata.extractionMode ?? "—"}</strong>
        </article>
      </div>

      {result && result.warnings.length > 0 && (
        <div className="attachment-warning-list">
          <strong>Warnings</strong>
          {result.warnings.map((warning) => (
            <span key={warning}>{warning}</span>
          ))}
        </div>
      )}
    </section>
  );
}
