import { useEffect, useState } from "react";
import type { QualityScore } from "../../document-quality/types/quality.types";
import { exportDocumentToPdf } from "../services/pdfExportService";
import { analyzePrintReadiness, type PrintOrientation } from "../services/printLayoutService";
import type { PdfExportReadiness, PdfExportResult } from "../types/export.types";
import PrintPreviewToolbar from "./PrintPreviewToolbar";
import SourceDownloadButton from "../../document-versioning/components/SourceDownloadButton";
import "../styles/print.css";

type ExportPanelProps = {
  documentId: string;
  title: string;
  contentElementId: string;
  contentSource: string;
  score: QualityScore;
  version: number;
};

export default function ExportPanel({ documentId, title, contentElementId, contentSource, score, version }: ExportPanelProps) {
  const [orientation, setOrientation] = useState<PrintOrientation>("portrait");
  const [readiness, setReadiness] = useState<PdfExportReadiness | null>(null);
  const [lastExport, setLastExport] = useState<PdfExportResult | null>(null);
  const [exporting, setExporting] = useState(false);
  const criticalWarnings = score.warnings.filter((warning) => warning.level === "critical");
  const versionLabel = version > 0 ? version : "source";

  useEffect(() => {
    const element = document.getElementById(contentElementId);
    const nextReadiness = analyzePrintReadiness(element);
    setReadiness(nextReadiness);
    setOrientation(nextReadiness.recommendedOrientation);
  }, [contentElementId, contentSource]);

  async function handleExport() {
    setExporting(true);
    try {
      const result = await exportDocumentToPdf({
        documentId,
        title,
        contentElementId,
        orientation,
      });
      setLastExport(result);
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className="export-panel no-print">
      <header>
        <div>
          <p className="bcvb-eyebrow">Export PDF</p>
          <h2>Publication et source</h2>
          <span>Version {versionLabel} · score {score.globalScore}/100</span>
        </div>
      </header>

      <PrintPreviewToolbar
        orientation={orientation}
        recommendedOrientation={readiness?.recommendedOrientation}
        onOrientationChange={setOrientation}
      />

      {readiness && (
        <div className="export-readiness-grid">
          <article>
            <span>Score export</span>
            <strong>{readiness.score}/100</strong>
          </article>
          <article>
            <span>Tableaux</span>
            <strong>{readiness.tableCount}</strong>
          </article>
          <article>
            <span>Blocs protégés</span>
            <strong>{readiness.protectedBlockCount}</strong>
          </article>
          <article>
            <span>Risque coupe</span>
            <strong>{readiness.oversizedBlockCount}</strong>
          </article>
        </div>
      )}

      {(score.globalScore < 85 || criticalWarnings.length > 0) && (
        <div className="export-warning">
          <strong>Export à relire</strong>
          <p>
            Le score ou les warnings critiques indiquent que l’export ne doit pas être publié sans validation humaine.
          </p>
        </div>
      )}

      {readiness && readiness.warnings.length > 0 && (
        <div className="export-warning-list">
          {readiness.warnings.map((warning) => (
            <article className={`export-warning export-warning--${warning.level}`} key={warning.id}>
              <strong>{warning.message}</strong>
              <p>{warning.action}</p>
            </article>
          ))}
        </div>
      )}

      <div className="export-actions">
        <button type="button" onClick={handleExport} disabled={exporting}>
          {exporting ? "Export..." : "Exporter PDF premium"}
        </button>
        <SourceDownloadButton documentId={documentId} contentSource={contentSource} />
      </div>

      {lastExport && (
        <p className="export-result-note">
          Dernier export : {lastExport.fileName} · {lastExport.orientation === "landscape" ? "A4 paysage" : "A4 portrait"}
          {lastExport.fallbackUsed ? " · impression navigateur utilisée" : " · PDF généré"}
        </p>
      )}
    </section>
  );
}
