import type { AttachmentProcessingOptions, AttachmentProcessingResult } from "../../../types/attachments";
import { detectAttachmentKind } from "./attachmentDetector";
import { extractTextFromPdf } from "./pdfTextExtractor";
import { extractOcrFromScannedPdf } from "./pdfOcrExtractor";
import { extractOcrFromImage } from "./imageOcrExtractor";
import { cleanOcrText } from "./ocrCleaner";

function createAttachmentId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `attachment-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

async function processUnknownAttachment(file: File): Promise<AttachmentProcessingResult> {
  const createdAt = new Date().toISOString();
  const canReadAsText = file.type.startsWith("text/") || /\.(txt|md|csv|json)$/i.test(file.name);
  const rawText = canReadAsText ? await file.text() : "";
  const cleaned = cleanOcrText(rawText);
  const warnings = canReadAsText
    ? cleaned.warnings
    : ["Format non pris en charge automatiquement", "OCR possiblement incomplet"];

  return {
    id: createAttachmentId(),
    fileName: file.name,
    mimeType: file.type || "unknown",
    size: file.size,
    kind: "unknown",
    status: canReadAsText ? "low_confidence" : "error",
    rawText,
    cleanedText: cleaned.cleanedText,
    pages: [
      {
        pageNumber: 1,
        rawText,
        cleanedText: cleaned.cleanedText,
        confidence: cleaned.confidence,
        warnings,
      },
    ],
    confidence: cleaned.confidence,
    warnings,
    metadata: {
      importedAt: createdAt,
      pageCount: 1,
      extractionMode: canReadAsText ? "Texte brut" : "Inconnu",
      originalFileName: file.name,
      emptyPages: rawText.trim() ? [] : [1],
      lowConfidencePages: [1],
    },
    createdAt,
    updatedAt: new Date().toISOString(),
  };
}

export async function processAttachment(
  file: File,
  options: AttachmentProcessingOptions = {}
): Promise<AttachmentProcessingResult> {
  try {
    options.onProgress?.({ status: "uploaded", progress: 4, message: "Fichier reçu localement." });

    if (options.signal?.aborted) throw new DOMException("Traitement annulé.", "AbortError");

    options.onProgress?.({ status: "detecting", progress: 10, message: "Détection du type de fichier." });
    const kind = await detectAttachmentKind(file);

    options.onProgress?.({
      status: kind === "pdf_text" ? "extracting_text" : kind === "unknown" ? "detecting" : "ocr_pending",
      progress: 18,
      message:
        kind === "pdf_text"
          ? "PDF texte détecté : extraction native sans OCR."
          : kind === "pdf_scanned"
            ? "PDF scanné détecté : OCR multipages requis."
            : kind === "image"
              ? "Image détectée : prétraitement puis OCR."
              : "Format inconnu : tentative de lecture texte.",
    });

    if (kind === "pdf_text") {
      const result = await extractTextFromPdf(file);
      options.onProgress?.({ status: result.status, progress: 100, message: "PDF texte extrait." });
      return result;
    }

    if (kind === "pdf_scanned") {
      const result = await extractOcrFromScannedPdf(file, options);
      options.onProgress?.({ status: result.status, progress: 100, message: "OCR PDF terminé." });
      return result;
    }

    if (kind === "image") {
      const result = await extractOcrFromImage(file, options);
      options.onProgress?.({ status: result.status, progress: 100, message: "OCR image terminé." });
      return result;
    }

    const result = await processUnknownAttachment(file);
    options.onProgress?.({ status: result.status, progress: 100, message: "Traitement terminé avec réserves." });
    return result;
  } catch (error) {
    const createdAt = new Date().toISOString();
    const message = error instanceof Error ? error.message : "Erreur inconnue pendant le traitement.";

    options.onProgress?.({ status: "error", progress: 100, message });

    return {
      id: createAttachmentId(),
      fileName: file.name,
      mimeType: file.type || "unknown",
      size: file.size,
      kind: "unknown",
      status: "error",
      rawText: "",
      cleanedText: "",
      pages: [],
      confidence: 0,
      warnings: [message],
      metadata: {
        importedAt: createdAt,
        pageCount: 0,
        extractionMode: "Inconnu",
        originalFileName: file.name,
        emptyPages: [],
        lowConfidencePages: [],
      },
      createdAt,
      updatedAt: createdAt,
    };
  }
}
