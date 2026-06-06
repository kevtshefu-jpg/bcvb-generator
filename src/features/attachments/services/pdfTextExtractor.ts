import * as pdfjsLib from "pdfjs-dist";
// @ts-ignore
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import type { AttachmentProcessingResult, OCRPageResult } from "../../../types/attachments";
import { cleanOcrPages, computeAttachmentWarnings } from "./ocrCleaner";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function createAttachmentId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `attachment-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

export async function extractTextFromPdf(file: File): Promise<AttachmentProcessingResult> {
  const createdAt = new Date().toISOString();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: OCRPageResult[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const rawText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s{2,}/g, " ")
      .trim();

    pages.push({
      pageNumber,
      rawText,
      cleanedText: rawText,
      confidence: rawText.length > 160 ? 96 : 74,
      warnings: rawText.length < 80 ? ["Texte très court"] : [],
    });
  }

  const cleanedPages = cleanOcrPages(pages);
  const rawText = pages.map((page) => `--- Page ${page.pageNumber} ---\n${page.rawText}`).join("\n\n");
  const cleanedText = cleanedPages.map((page) => `--- Page ${page.pageNumber} ---\n${page.cleanedText}`).join("\n\n");
  const confidence = Math.round(
    cleanedPages.reduce((sum, page) => sum + page.confidence, 0) / Math.max(1, cleanedPages.length)
  );
  const warnings = computeAttachmentWarnings(cleanedPages, rawText);
  const emptyPages = cleanedPages.filter((page) => !page.cleanedText.trim()).map((page) => page.pageNumber);
  const lowConfidencePages = cleanedPages.filter((page) => page.confidence < 62).map((page) => page.pageNumber);

  return {
    id: createAttachmentId(),
    fileName: file.name,
    mimeType: file.type || "application/pdf",
    size: file.size,
    kind: "pdf_text",
    status: warnings.length > 0 ? "low_confidence" : "ready",
    rawText,
    cleanedText,
    pages: cleanedPages,
    confidence,
    warnings,
    metadata: {
      importedAt: createdAt,
      pageCount: pdf.numPages,
      extractionMode: "PDF texte",
      originalFileName: file.name,
      emptyPages,
      lowConfidencePages,
    },
    createdAt,
    updatedAt: new Date().toISOString(),
  };
}
