import { createWorker } from "tesseract.js";
import type { AttachmentProcessingOptions, AttachmentProcessingResult, OCRPageResult } from "../../../types/attachments";
import { cleanOcrPages, computeAttachmentWarnings } from "./ocrCleaner";

function createAttachmentId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `attachment-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

export type OcrFailureCode = "empty" | "network" | "provider" | "invalid_file";

const failureMessages: Record<OcrFailureCode, string> = {
  empty: "Aucun texte n’a été détecté dans ce fichier.",
  network: "L’extraction est momentanément indisponible. Réessayez.",
  provider: "L’extraction n’a pas pu aboutir. Réessayez ou saisissez le texte.",
  invalid_file: "Ce fichier image ne peut pas être lu.",
};

export class OcrExtractionError extends Error {
  constructor(public readonly code: OcrFailureCode, public readonly cause?: unknown) {
    super(failureMessages[code]);
    this.name = "OcrExtractionError";
  }
}

function isNetworkFailure(error: unknown) {
  if (error instanceof TypeError) return true;
  const message = error instanceof Error ? error.message : String(error);
  return /network|fetch|connexion|internet|load.*(language|traineddata)/i.test(message);
}

function normalizeOcrFailure(error: unknown) {
  if (error instanceof OcrExtractionError) return error;
  return new OcrExtractionError(isNetworkFailure(error) ? "network" : "provider", error);
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image illisible."));
    };
    image.src = url;
  });
}

async function preprocessImage(file: File) {
  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  const maxWidth = 1800;
  const scale = Math.min(1, maxWidth / Math.max(1, image.width));
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) throw new Error("Prétraitement image impossible.");

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let index = 0; index < data.length; index += 4) {
    const gray = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    const contrasted = Math.max(0, Math.min(255, (gray - 128) * 1.22 + 128));
    data[index] = contrasted;
    data[index + 1] = contrasted;
    data[index + 2] = contrasted;
  }

  context.putImageData(imageData, 0, 0);
  return canvas;
}

export async function recognizeCanvasWithOcr(canvas: HTMLCanvasElement) {
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;

  try {
    worker = await createWorker("fra+eng");
    const { data } = await worker.recognize(canvas);
    const text = data.text.trim();
    if (!text) throw new OcrExtractionError("empty");
    return {
      text,
      confidence: Math.round(data.confidence ?? 70),
    };
  } catch (error) {
    throw normalizeOcrFailure(error);
  } finally {
    await worker?.terminate();
  }
}

export async function extractOcrFromImage(
  file: File,
  options: AttachmentProcessingOptions = {}
): Promise<AttachmentProcessingResult> {
  if (!file || file.size === 0 || !file.type.startsWith("image/")) {
    throw new OcrExtractionError("invalid_file");
  }

  const createdAt = new Date().toISOString();
  options.onProgress?.({ status: "ocr_processing", progress: 24, message: "Prétraitement image : contraste et bruit." });
  const canvas = await preprocessImage(file);
  const imagePreviewUrl = canvas.toDataURL("image/png");

  options.onProgress?.({ status: "ocr_processing", progress: 48, message: "OCR image en cours.", pageNumber: 1 });
  const ocr = await recognizeCanvasWithOcr(canvas);

  const pages: OCRPageResult[] = [
    {
      pageNumber: 1,
      rawText: ocr.text,
      cleanedText: ocr.text,
      confidence: ocr.confidence,
      imagePreviewUrl,
      warnings: ["Document scanné : relire avant publication"],
    },
  ];

  options.onProgress?.({ status: "cleaning", progress: 78, message: "Nettoyage OCR et analyse qualité." });
  const cleanedPages = cleanOcrPages(pages);
  const rawText = cleanedPages[0]?.rawText ?? "";
  const cleanedText = cleanedPages[0]?.cleanedText ?? "";
  const warnings = computeAttachmentWarnings(cleanedPages, rawText);
  const confidence = cleanedPages[0]?.confidence ?? 0;

  return {
    id: createAttachmentId(),
    fileName: file.name,
    mimeType: file.type || "image/*",
    size: file.size,
    kind: "image",
    status: confidence < 62 || warnings.length > 0 ? "low_confidence" : "ready",
    rawText,
    cleanedText,
    pages: cleanedPages,
    confidence,
    warnings,
    metadata: {
      importedAt: createdAt,
      pageCount: 1,
      extractionMode: "Image",
      originalFileName: file.name,
      emptyPages: cleanedPages.filter((page) => !page.cleanedText.trim()).map((page) => page.pageNumber),
      lowConfidencePages: cleanedPages.filter((page) => page.confidence < 62).map((page) => page.pageNumber),
    },
    createdAt,
    updatedAt: new Date().toISOString(),
  };
}
