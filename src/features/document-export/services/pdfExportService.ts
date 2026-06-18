import { exportNodeToPdf } from "../../../utils/exportPdf";
import type { PdfExportResult } from "../types/export.types";
import { analyzePrintReadiness, preparePrintLayout, type PrintOrientation } from "./printLayoutService";

export async function exportDocumentToPdf(input: {
  documentId: string;
  title: string;
  contentElementId: string;
  fileName?: string;
  orientation?: PrintOrientation;
}): Promise<PdfExportResult> {
  const element = document.getElementById(input.contentElementId);
  if (!element) throw new Error(`Élément ${input.contentElementId} introuvable pour export PDF.`);

  const readiness = analyzePrintReadiness(element);
  const orientation = input.orientation ?? readiness.recommendedOrientation;
  const cleanup = preparePrintLayout(input.contentElementId, orientation);
  const fileName =
    input.fileName ??
    `${input.title || input.documentId}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .concat(".pdf");

  try {
    await exportNodeToPdf(element, fileName, {
      orientation,
      title: input.title,
      marginMm: 10,
      includePageNumbers: true,
    });
    return {
      engine: "jspdf_html2canvas",
      fileName,
      orientation,
      exportedAt: new Date().toISOString(),
      fallbackUsed: false,
      warnings: readiness.warnings,
    };
  } catch (error) {
    console.warn("Export jsPDF indisponible, fallback window.print :", error);
    window.print();
    return {
      engine: "browser_print_fallback",
      fileName,
      orientation,
      exportedAt: new Date().toISOString(),
      fallbackUsed: true,
      warnings: readiness.warnings,
    };
  } finally {
    window.setTimeout(cleanup, 300);
  }
}
