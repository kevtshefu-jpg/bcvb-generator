import type { DirectorDocumentStatus } from "../../types/directors";

type DirectorDocumentTarget = {
  id: string;
  status: DirectorDocumentStatus | "draft";
  validationHistory?: Array<{ id: string; userId: string; status: DirectorDocumentStatus; comment?: string; createdAt: string }>;
  updatedAt?: string;
  validatedBy?: string;
};

function createRecord(documentId: string, userId: string, status: DirectorDocumentStatus, comment?: string) {
  return {
    id: `director-validation-${documentId}-${Date.now().toString(36)}`,
    userId,
    status,
    comment,
    createdAt: new Date().toISOString(),
  };
}

function applyStatus<T extends DirectorDocumentTarget>(
  document: T,
  status: DirectorDocumentStatus,
  userId: string,
  comment?: string
) {
  return {
    ...document,
    status,
    updatedAt: new Date().toISOString(),
    validatedBy: status === "published" ? userId : document.validatedBy,
    validationHistory: [createRecord(document.id, userId, status, comment), ...(document.validationHistory || [])],
  };
}

export function submitForValidation<T extends DirectorDocumentTarget>(document: T, userId = "responsable-technique") {
  return applyStatus(document, "pending_validation", userId, "Document soumis à validation dirigeant.") as T;
}

export function validateDocument<T extends DirectorDocumentTarget>(document: T, userId: string, comment = "Validation pour publication.") {
  return applyStatus(document, "published", userId, comment) as T;
}

export function requestCorrection<T extends DirectorDocumentTarget>(document: T, userId: string, comment: string) {
  if (!comment.trim()) {
    throw new Error("Une demande de correction doit contenir un commentaire.");
  }
  return applyStatus(document, "to_correct", userId, comment) as T;
}

export function archiveDirectorDocument<T extends DirectorDocumentTarget>(document: T, userId: string) {
  return applyStatus(document, "archived", userId, "Archivage sécurisé.") as T;
}
