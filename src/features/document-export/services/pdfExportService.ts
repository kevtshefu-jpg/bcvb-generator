import { exportNodeToPdf } from "../../../utils/exportPdf";
import { preparePrintLayout, type PrintOrientation } from "./printLayoutService";

export async function exportDocumentToPdf(input: {
  documentId: string;
  title: string;
  contentElementId: string;
  fileName?: string;
  orientation?: PrintOrientation;
}): Promise<void> {
  const element = document.getElementById(input.contentElementId);
  if (!element) throw new Error(`Élément ${input.contentElementId} introuvable pour export PDF.`);

  const orientation = input.orientation ?? "portrait";
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
    await exportNodeToPdf(element, fileName, { orientation });
  } catch (error) {
    console.warn("Export jsPDF indisponible, fallback window.print :", error);
    window.print();
  } finally {
    window.setTimeout(cleanup, 300);
  }
}
