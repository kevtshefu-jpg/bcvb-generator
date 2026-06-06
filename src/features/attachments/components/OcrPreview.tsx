import { useEffect, useState } from "react";
import type { AttachmentProcessingResult, OCRPageResult } from "../../../types/attachments";

type OcrPreviewProps = {
  result: AttachmentProcessingResult | null;
  onChange: (result: AttachmentProcessingResult) => void;
  retryingPageNumber?: number | null;
  onRetryPage?: (pageNumber: number) => void;
  requestedTab?: PreviewTab;
};

export type PreviewTab = "cleaned" | "raw" | "pages";

export default function OcrPreview({ result, onChange, retryingPageNumber = null, onRetryPage, requestedTab }: OcrPreviewProps) {
  const [tab, setTab] = useState<PreviewTab>("cleaned");

  useEffect(() => {
    if (requestedTab) setTab(requestedTab);
  }, [requestedTab]);

  if (!result) {
    return (
      <section className="ocr-preview ocr-preview--empty">
        <p className="bcvb-eyebrow">Prévisualisation</p>
        <h2>Aucune extraction pour le moment</h2>
        <p>Dépose un fichier pour afficher le texte brut, le texte nettoyé, les pages et les warnings OCR.</p>
      </section>
    );
  }

  function updateCleanedText(cleanedText: string) {
    if (!result) return;
    onChange({ ...result, cleanedText, updatedAt: new Date().toISOString() });
  }

  function updatePage(page: OCRPageResult, cleanedText: string) {
    if (!result) return;
    const pages = result.pages.map((item) => (item.pageNumber === page.pageNumber ? { ...item, cleanedText } : item));
    onChange({
      ...result,
      pages,
      cleanedText: pages.map((item) => `--- Page ${item.pageNumber} ---\n${item.cleanedText}`).join("\n\n"),
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <section className="ocr-preview">
      <header>
        <div>
          <p className="bcvb-eyebrow">Prévisualisation OCR</p>
          <h2>{result.fileName}</h2>
          <span>
            Brut conservé · texte nettoyé éditable · {result.pages.length} page{result.pages.length > 1 ? "s" : ""}
            {result.confidence < 70 ? " · qualité faible — relecture nécessaire" : ""}
          </span>
        </div>
        <div className="ocr-preview__tabs">
          {(["cleaned", "raw", "pages"] as PreviewTab[]).map((nextTab) => (
            <button
              type="button"
              className={tab === nextTab ? "is-active" : ""}
              key={nextTab}
              onClick={() => setTab(nextTab)}
            >
              {nextTab === "cleaned" ? "Nettoyé" : nextTab === "raw" ? "Brut" : "Pages"}
            </button>
          ))}
        </div>
      </header>

      {tab === "cleaned" && (
        <textarea
          className="ocr-preview__textarea"
          value={result.cleanedText}
          onChange={(event) => updateCleanedText(event.target.value)}
        />
      )}

      {tab === "raw" && <pre className="ocr-preview__raw">{result.rawText || "Aucun texte brut disponible."}</pre>}

      {tab === "pages" && (
        <div className="ocr-page-list">
          {result.pages.map((page) => (
            <article className={page.confidence < 62 ? "ocr-page-card ocr-page-card--weak" : "ocr-page-card"} key={page.pageNumber}>
              <div className="ocr-page-card__preview">
                {page.imagePreviewUrl ? <img src={page.imagePreviewUrl} alt={`Page ${page.pageNumber}`} /> : <span>PDF texte</span>}
              </div>
              <div className="ocr-page-card__content">
                <header>
                  <h3>Page {page.pageNumber}</h3>
                  <span>{page.confidence}%</span>
                </header>
                {page.warnings.length > 0 && (
                  <div className="ocr-page-card__warnings">
                    {page.warnings.map((warning) => (
                      <span key={warning}>{warning}</span>
                    ))}
                  </div>
                )}
                {onRetryPage && page.imagePreviewUrl && (
                  <button
                    type="button"
                    className="ocr-page-card__retry"
                    onClick={() => onRetryPage(page.pageNumber)}
                    disabled={retryingPageNumber === page.pageNumber}
                  >
                    {retryingPageNumber === page.pageNumber ? "Relance OCR..." : "Relancer OCR page"}
                  </button>
                )}
                <textarea value={page.cleanedText} onChange={(event) => updatePage(page, event.target.value)} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
