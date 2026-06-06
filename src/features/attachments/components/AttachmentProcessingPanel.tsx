import type { AttachmentProcessingResult, AttachmentProgressEvent } from "../../../types/attachments";
import {
  attachmentKindLabels,
  attachmentStatusLabels,
  formatFileSize,
  getAttachmentSolution,
  getFriendlyProgressMessage,
} from "../services/attachmentUiLabels";

type AttachmentProcessingPanelProps = {
  result: AttachmentProcessingResult | null;
  progress: AttachmentProgressEvent | null;
  processing: boolean;
  onReset: () => void;
  onCancel: () => void;
  onShowRaw?: () => void;
  onShowCleaned?: () => void;
  onCorrect?: () => void;
  onTransform?: () => void;
};

export default function AttachmentProcessingPanel({
  result,
  progress,
  processing,
  onReset,
  onCancel,
  onShowRaw,
  onShowCleaned,
  onCorrect,
  onTransform,
}: AttachmentProcessingPanelProps) {
  const status = progress?.status ?? result?.status ?? "uploaded";
  const progressValue = progress?.progress ?? (result ? 100 : 0);
  const friendlyMessage = getFriendlyProgressMessage(progress, result);
  const solution = getAttachmentSolution(status);

  return (
    <section className="attachment-processing-panel">
      <header>
        <div>
          <p className="bcvb-eyebrow">Traitement</p>
          <h2>{attachmentStatusLabels[status] ?? status}</h2>
          <span>{friendlyMessage}</span>
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

      <p className="attachment-processing-solution">{solution}</p>

      <div className="attachment-processing-grid">
        <article>
          <span>Type détecté</span>
          <strong>{result ? attachmentKindLabels[result.kind] : "—"}</strong>
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

      {result && (
        <article className={`attachment-file-card attachment-file-card--${result.status}`}>
          <div>
            <p className="bcvb-eyebrow">Fichier importé</p>
            <h3>{result.fileName}</h3>
            <span>
              {attachmentKindLabels[result.kind]} · {formatFileSize(result.size)} · {attachmentStatusLabels[result.status]}
            </span>
          </div>
          <div className="attachment-file-card__meter">
            <span>Progression</span>
            <strong>{progressValue}%</strong>
          </div>
          <div className="attachment-file-card__meter">
            <span>Score confiance OCR</span>
            <strong>{result.confidence}%</strong>
          </div>
          <div className="attachment-file-card__actions">
            <button type="button" onClick={onShowRaw}>
              Voir texte brut
            </button>
            <button type="button" onClick={onShowCleaned}>
              Voir texte nettoyé
            </button>
            <button type="button" onClick={onCorrect}>
              Corriger
            </button>
            <button type="button" onClick={onTransform}>
              Transformer en document BCVB
            </button>
            <button type="button" onClick={onReset}>
              Supprimer
            </button>
          </div>
        </article>
      )}

      {result && result.warnings.length > 0 && (
        <div className="attachment-warning-list">
          <strong>Avertissements à relire</strong>
          {result.warnings.map((warning) => (
            <span key={warning}>{warning}</span>
          ))}
        </div>
      )}
    </section>
  );
}
