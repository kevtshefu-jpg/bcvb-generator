import * as pdfjsLib from "pdfjs-dist";
// @ts-ignore
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import type { AttachmentKind } from "../../../types/attachments";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export async function isTextPdf(file: File): Promise<boolean> {
  if (!file.type.includes("pdf") && !/\.pdf$/i.test(file.name)) return false;

  try {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pagesToRead = Math.min(pdf.numPages, 3);
    let extractedLength = 0;

    for (let pageNumber = 1; pageNumber <= pagesToRead; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .trim();
      extractedLength += pageText.length;
    }

    return extractedLength > 80;
  } catch (error) {
    console.warn("Détection PDF texte impossible :", error);
    return false;
  }
}

export async function detectAttachmentKind(file: File): Promise<AttachmentKind> {
  if (file.type.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(file.name)) return "image";

  if (file.type.includes("pdf") || /\.pdf$/i.test(file.name)) {
    return (await isTextPdf(file)) ? "pdf_text" : "pdf_scanned";
  }

  return "unknown";
}
