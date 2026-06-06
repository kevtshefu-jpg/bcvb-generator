import type { AttachmentProcessingOptions, AttachmentProcessingResult, OCRPageResult } from "../../../types/attachments";
import { renderPdfPagesToImages } from "../../ai-document/utils/ocr/renderPdfPagesToImages";
import { cleanOcrPages, computeAttachmentWarnings } from "./ocrCleaner";
import { recognizeCanvasWithOcr } from "./imageOcrExtractor";

function createAttachmentId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `attachment-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

export async function extractOcrFromScannedPdf(
  file: File,
  options: AttachmentProcessingOptions = {}
): Promise<AttachmentProcessingResult> {
  const createdAt = new Date().toISOString();
  const maxPages = options.maxPages ?? 8;

  options.onProgress?.({ status: "ocr_pending", progress: 16, message: "Conversion du PDF scanné en images." });
  const rendered = await renderPdfPagesToImages(file, maxPages);
  const pages: OCRPageResult[] = [];

  for (let index = 0; index < rendered.canvases.length; index += 1) {
    if (options.signal?.aborted) throw new DOMException("Traitement OCR annulé.", "AbortError");

    const pageNumber = index + 1;
    const progress = 24 + Math.round((pageNumber / Math.max(1, rendered.canvases.length)) * 52);
    options.onProgress?.({
      status: "ocr_processing",
      progress,
      message: `OCR page ${pageNumber}/${rendered.renderedPages}.`,
      pageNumber,
    });

    const canvas = rendered.canvases[index];
    const ocr = await recognizeCanvasWithOcr(canvas, `${file.name} page ${pageNumber}`, options.useMockOcr);

    pages.push({
      pageNumber,
      rawText: ocr.text,
      cleanedText: ocr.text,
      confidence: ocr.confidence,
      imagePreviewUrl: canvas.toDataURL("image/png"),
      warnings: ["Document scanné : relire avant publication"],
    });
  }

  options.onProgress?.({ status: "cleaning", progress: 82, message: "Nettoyage OCR multipages." });
  const cleanedPages = cleanOcrPages(pages);
  const rawText = cleanedPages.map((page) => `--- Page ${page.pageNumber} ---\n${page.rawText}`).join("\n\n");
  const cleanedText = cleanedPages.map((page) => `--- Page ${page.pageNumber} ---\n${page.cleanedText}`).join("\n\n");
  const confidence = Math.round(
    cleanedPages.reduce((sum, page) => sum + page.confidence, 0) / Math.max(1, cleanedPages.length)
  );
  const warnings = new Set(computeAttachmentWarnings(cleanedPages, rawText));
  if (rendered.warning) warnings.add(rendered.warning);
  if (confidence < 62) warnings.add("OCR possiblement incomplet");

  return {
    id: createAttachmentId(),
    fileName: file.name,
    mimeType: file.type || "application/pdf",
    size: file.size,
    kind: "pdf_scanned",
    status: confidence < 62 || warnings.size > 0 ? "low_confidence" : "ready",
    rawText,
    cleanedText,
    pages: cleanedPages,
    confidence,
    warnings: Array.from(warnings),
    metadata: {
      importedAt: createdAt,
      pageCount: rendered.pageCount,
      extractionMode: "PDF scanné",
      originalFileName: file.name,
      emptyPages: cleanedPages.filter((page) => !page.cleanedText.trim()).map((page) => page.pageNumber),
      lowConfidencePages: cleanedPages.filter((page) => page.confidence < 62).map((page) => page.pageNumber),
    },
    createdAt,
    updatedAt: new Date().toISOString(),
  };
}
