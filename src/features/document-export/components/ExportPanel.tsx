import { useState } from "react";
import type { QualityScore } from "../../document-quality/types/quality.types";
import { exportDocumentToPdf } from "../services/pdfExportService";
import type { PrintOrientation } from "../services/printLayoutService";
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
  const [exporting, setExporting] = useState(false);
  const criticalWarnings = score.warnings.filter((warning) => warning.level === "critical");
  const versionLabel = version > 0 ? version : "source";

  async function handleExport() {
    setExporting(true);
    try {
      await exportDocumentToPdf({
        documentId,
        title,
        contentElementId,
        orientation,
      });
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

      <PrintPreviewToolbar orientation={orientation} onOrientationChange={setOrientation} />

      {(score.globalScore < 85 || criticalWarnings.length > 0) && (
        <div className="export-warning">
          <strong>Export à relire</strong>
          <p>
            Le score ou les warnings critiques indiquent que l’export ne doit pas être publié sans validation humaine.
          </p>
        </div>
      )}

      <div className="export-actions">
        <button type="button" onClick={handleExport} disabled={exporting}>
          {exporting ? "Export..." : "Exporter PDF premium"}
        </button>
        <SourceDownloadButton documentId={documentId} contentSource={contentSource} />
      </div>
    </section>
  );
}
