import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  AttachmentProcessingResult,
  AttachmentProgressEvent,
  BcvbDocumentType,
  OCRPageResult,
} from "../../../types/attachments";
import { defaultEditorialStudioState, saveEditorialStudioState } from "../../../utils/editorialStudioStorage.js";
import { saveEditorialDraft } from "../../../utils/editorialDraftStorage";
import AttachmentDropzone from "./AttachmentDropzone";
import AttachmentProcessingPanel from "./AttachmentProcessingPanel";
import AttachmentToDocumentPanel from "./AttachmentToDocumentPanel";
import OcrPreview from "./OcrPreview";
import { processAttachment } from "../services/attachmentPipeline";
import { recognizeCanvasWithOcr } from "../services/imageOcrExtractor";
import { cleanOcrPages } from "../services/ocrCleaner";
import "../../../styles/attachments.css";

function mapDocumentTypeToStudioFamily(documentType: BcvbDocumentType) {
  if (documentType === "cahier_technique") return "technical-book";
  if (documentType === "fiche_seance" || documentType === "situation_pedagogique") return "practice-session";
  if (documentType === "outil_evaluation") return "theme-sheet";
  return "coach-guide";
}

function loadImageFromUrl(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Prévisualisation image illisible."));
    image.src = url;
  });
}

async function canvasFromImageUrl(url: string) {
  const image = await loadImageFromUrl(url);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) throw new Error("Canvas OCR indisponible.");

  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  context.drawImage(image, 0, 0);
  return canvas;
}

export default function AttachmentsOcrAdminPage() {
  const navigate = useNavigate();
  const abortControllerRef = useRef<AbortController | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<AttachmentProcessingResult | null>(null);
  const [progress, setProgress] = useState<AttachmentProgressEvent | null>(null);
  const [processing, setProcessing] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [message, setMessage] = useState("Dépose une pièce jointe pour démarrer la chaîne OCR.");
  const [retryingPageNumber, setRetryingPageNumber] = useState<number | null>(null);

  async function handleFile(file: File) {
    setSelectedFile(file);
    setResult(null);
    setMarkdown("");
    setProcessing(true);
    setMessage(`Traitement de ${file.name} en cours.`);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const nextResult = await processAttachment(file, {
      maxPages: 8,
      signal: abortController.signal,
      onProgress: setProgress,
    });

    setResult(nextResult);
    setProcessing(false);
    setMessage(
      nextResult.status === "error"
        ? "Le traitement a échoué. Vérifie le fichier ou essaie une source plus lisible."
        : "Extraction terminée. Relis le texte nettoyé avant transformation."
    );
  }

  function cancelProcessing() {
    abortControllerRef.current?.abort();
    setProcessing(false);
    setProgress({ status: "error", progress: 100, message: "Traitement annulé par l’admin." });
  }

  function resetProcessing() {
    abortControllerRef.current?.abort();
    setSelectedFile(null);
    setResult(null);
    setProgress(null);
    setProcessing(false);
    setMarkdown("");
    setMessage("Dépose une pièce jointe pour démarrer la chaîne OCR.");
  }

  async function retryPageOcr(pageNumber: number) {
    if (!result) return;
    const page = result.pages.find((item) => item.pageNumber === pageNumber);
    if (!page?.imagePreviewUrl) return;

    setRetryingPageNumber(pageNumber);
    setMessage(`Relance OCR page ${pageNumber}.`);

    try {
      const canvas = await canvasFromImageUrl(page.imagePreviewUrl);
      const ocr = await recognizeCanvasWithOcr(canvas, `${result.fileName} page ${pageNumber}`);
      const nextPages: OCRPageResult[] = result.pages.map((item) =>
        item.pageNumber === pageNumber
          ? {
              ...item,
              rawText: ocr.text,
              cleanedText: ocr.text,
              confidence: ocr.confidence,
              warnings: ["Page relancée : relire avant publication"],
            }
          : item
      );
      const cleanedPages = cleanOcrPages(nextPages);
      setResult({
        ...result,
        pages: cleanedPages,
        rawText: cleanedPages.map((item) => `--- Page ${item.pageNumber} ---\n${item.rawText}`).join("\n\n"),
        cleanedText: cleanedPages.map((item) => `--- Page ${item.pageNumber} ---\n${item.cleanedText}`).join("\n\n"),
        confidence: Math.round(cleanedPages.reduce((sum, item) => sum + item.confidence, 0) / Math.max(1, cleanedPages.length)),
        updatedAt: new Date().toISOString(),
      });
      setMessage(`OCR page ${pageNumber} relancé.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Relance OCR impossible.");
    } finally {
      setRetryingPageNumber(null);
    }
  }

  function sendToStudio(documentType: BcvbDocumentType, draftMarkdown: string) {
    if (!result) return;

    const sourceText = draftMarkdown.trim() || result.cleanedText;
    const family = mapDocumentTypeToStudioFamily(documentType);
    const title = `Transformation OCR - ${result.fileName}`;

    saveEditorialStudioState({
      ...defaultEditorialStudioState,
      targetDocument: title,
      family,
      category: "OCR",
      audience: "Admin",
      productionLevel: "Publication club",
      sourceText,
      recommendedAction: "Relire les incertitudes OCR puis générer le plan éditorial.",
      sourceDocumentId: result.id,
      transformedFromTitle: result.fileName,
      transformationDate: new Date().toISOString(),
      transformationMode: "bcvb_upgrade",
      steps: {
        framing: "validé",
        sources: "validé",
        plan: "en cours",
        production: "non démarré",
        quality: "non démarré",
        export: "non démarré",
      },
      updatedAt: new Date().toISOString(),
    });

    saveEditorialDraft({
      activeStep: "sources",
      targetTitle: title,
      documentFamily: family,
      productionLevel: "Publication club",
      category: "OCR",
      audience: "Admin",
      sourceMode: "ocr",
      sourceText,
      extractedText: result.cleanedText,
      uploadedFileName: result.fileName,
      uploadedFileType: result.mimeType,
      normalizedMarkdown: draftMarkdown,
    });

    navigate("/admin/studio-editorial");
  }

  return (
    <main className="bcvb-page attachments-page">
      <section className="attachments-hero">
        <div>
          <p className="bcvb-eyebrow">OCR & pièces jointes</p>
          <h1>Transformer les sources brutes en matière documentaire BCVB</h1>
          <p>
            Import PDF texte, PDF scanné, image ou source texte, extraction native ou OCR, nettoyage, correction humaine,
            structuration BCVB Rich Markdown et envoi vers le Studio éditorial.
          </p>
        </div>
        <div className="attachments-hero__checks">
          <article>
            <span>PDF texte</span>
            <strong>Extraction native</strong>
          </article>
          <article>
            <span>Scans & images</span>
            <strong>OCR + warnings</strong>
          </article>
          <article>
            <span>Studio</span>
            <strong>Brouillon BCVB</strong>
          </article>
        </div>
      </section>

      <AttachmentDropzone disabled={processing} onFileSelected={handleFile} />

      <section className="attachments-grid">
        <AttachmentProcessingPanel
          result={result}
          progress={progress}
          processing={processing}
          onReset={resetProcessing}
          onCancel={cancelProcessing}
        />

        <section className="attachments-source-card">
          <p className="bcvb-eyebrow">Source active</p>
          <h2>{selectedFile?.name ?? "Aucun fichier"}</h2>
          <p>{message}</p>
          {selectedFile && (
            <dl>
              <div>
                <dt>Type</dt>
                <dd>{selectedFile.type || "Inconnu"}</dd>
              </div>
              <div>
                <dt>Taille</dt>
                <dd>{Math.round(selectedFile.size / 1024)} Ko</dd>
              </div>
            </dl>
          )}
        </section>
      </section>

      <OcrPreview result={result} onChange={setResult} retryingPageNumber={retryingPageNumber} onRetryPage={retryPageOcr} />

      <AttachmentToDocumentPanel
        result={result}
        markdown={markdown}
        onMarkdownChange={setMarkdown}
        onSendToStudio={sendToStudio}
      />
    </main>
  );
}
