import type {
  AttachmentKind,
  AttachmentProcessingResult,
  AttachmentProgressEvent,
  AttachmentStatus,
} from "../../../types/attachments";

export const attachmentKindLabels: Record<AttachmentKind, string> = {
  pdf_text: "PDF lisible",
  pdf_scanned: "PDF scanné",
  image: "Image / photo",
  unknown: "Format à vérifier",
};

export const attachmentStatusLabels: Record<AttachmentStatus, string> = {
  uploaded: "Fichier ajouté",
  detecting: "Analyse du fichier",
  extracting_text: "Extraction du texte",
  ocr_pending: "OCR à lancer",
  ocr_processing: "OCR en cours",
  cleaning: "Nettoyage du texte",
  ready: "Texte prêt à être utilisé",
  low_confidence: "Qualité faible — relecture nécessaire",
  error: "Erreur — action nécessaire",
};

export function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
  return `${Math.max(1, Math.round(size / 1024))} Ko`;
}

export function getFriendlyProgressMessage(progress: AttachmentProgressEvent | null, result?: AttachmentProcessingResult | null) {
  if (!progress) {
    if (!result) return "Ajoute un fichier pour démarrer.";
    if (result.status === "ready") return "Texte prêt à être utilisé.";
    if (result.status === "low_confidence") return "Qualité faible — relecture nécessaire.";
    if (result.status === "error") return "Erreur — vérifie le fichier ou essaie une source plus nette.";
    return attachmentStatusLabels[result.status];
  }

  if (progress.status === "ocr_processing") {
    const pageCount = result?.metadata.pageCount ?? result?.pages.length ?? null;
    const pageLabel = progress.pageNumber && pageCount ? ` — extraction page ${progress.pageNumber}/${pageCount}` : "";
    return `OCR en cours${pageLabel}`;
  }

  if (progress.status === "low_confidence") return "Qualité faible — relecture nécessaire.";
  if (progress.status === "ready") return "Texte prêt à être utilisé.";
  if (progress.status === "error") return `Erreur — ${progress.message || "une solution est nécessaire."}`;

  return progress.message || attachmentStatusLabels[progress.status];
}

export function getAttachmentSolution(status: AttachmentStatus) {
  if (status === "low_confidence") return "Relis les pages signalées, corrige le texte nettoyé puis transforme le document.";
  if (status === "error") return "Essaie un PDF plus net, une photo mieux cadrée ou relance l’OCR page par page.";
  if (status === "ready") return "Tu peux transformer ce texte en document BCVB.";
  if (status === "ocr_processing") return "Laisse l’extraction se terminer, puis vérifie les pages faibles.";
  return "Le site détecte le type, extrait le texte, nettoie et signale les incertitudes.";
}
