export type AttachmentKind = "pdf_text" | "pdf_scanned" | "image" | "unknown";

export type AttachmentStatus =
  | "uploaded"
  | "detecting"
  | "extracting_text"
  | "ocr_pending"
  | "ocr_processing"
  | "cleaning"
  | "ready"
  | "low_confidence"
  | "error";

export type BcvbDocumentType =
  | "guide_coach"
  | "cahier_technique"
  | "fiche_seance"
  | "situation_pedagogique"
  | "compte_rendu"
  | "outil_evaluation"
  | "document_familles"
  | "document_administratif";

export interface OCRPageResult {
  pageNumber: number;
  rawText: string;
  cleanedText: string;
  confidence: number;
  imagePreviewUrl?: string;
  warnings: string[];
}

export interface AttachmentMetadata {
  importedAt: string;
  pageCount: number;
  extractionMode: "PDF texte" | "PDF scanné" | "Image" | "Texte brut" | "Inconnu";
  originalFileName: string;
  emptyPages: number[];
  lowConfidencePages: number[];
}

export interface AttachmentProcessingResult {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  kind: AttachmentKind;
  status: AttachmentStatus;
  rawText: string;
  cleanedText: string;
  pages: OCRPageResult[];
  confidence: number;
  warnings: string[];
  metadata: AttachmentMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface CleanedOcrResult {
  cleanedText: string;
  confidence: number;
  warnings: string[];
}

export interface AttachmentProgressEvent {
  status: AttachmentStatus;
  progress: number;
  message: string;
  pageNumber?: number;
}

export interface AttachmentProcessingOptions {
  maxPages?: number;
  useMockOcr?: boolean;
  signal?: AbortSignal;
  onProgress?: (event: AttachmentProgressEvent) => void;
}
