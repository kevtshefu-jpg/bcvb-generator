import type { ValidationRecord, ValidationStatus } from "../../types/dirigeants";

type ValidatableTarget = {
  id: string;
  status?: string;
  validationStatus?: ValidationStatus;
  qualityScore?: number;
  score?: number;
  validationHistory?: ValidationRecord[];
  updatedAt?: string;
};

const PUBLISH_QUALITY_THRESHOLD = 78;

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function qualityOf(target: ValidatableTarget) {
  return target.qualityScore ?? target.score ?? 0;
}

function withRecord(
  target: ValidatableTarget,
  status: ValidationStatus,
  comment: string,
  actor = "BCVB",
  actorField: "requestedBy" | "validatedBy" | "rejectedBy" = "requestedBy"
) {
  const now = new Date().toISOString();
  const record: ValidationRecord = {
    id: createId("validation"),
    targetId: target.id,
    targetType: target.id.includes("planning") ? "planning" : "document",
    status,
    requestedBy: actorField === "requestedBy" ? actor : "BCVB",
    comment,
    createdAt: now,
    updatedAt: now,
    ...(actorField === "validatedBy" ? { validatedBy: actor } : {}),
    ...(actorField === "rejectedBy" ? { rejectedBy: actor } : {}),
  };

  return {
    ...target,
    validationStatus: status,
    status,
    updatedAt: now,
    validationHistory: [record, ...(target.validationHistory || [])],
  };
}

export function submitForDirigeantValidation<T extends ValidatableTarget>(target: T, requestedBy = "Responsable technique") {
  if (qualityOf(target) < PUBLISH_QUALITY_THRESHOLD) {
    return requestCorrection(target, `Score qualité insuffisant (${qualityOf(target)}/100).`, requestedBy);
  }

  return withRecord(target, "in_dirigeant_validation", "Soumis à validation dirigeant.", requestedBy, "requestedBy") as T;
}

export function validateByDirigeant<T extends ValidatableTarget>(target: T, comment = "Validation dirigeant accordée.", validatedBy = "Dirigeant BCVB") {
  if (qualityOf(target) < PUBLISH_QUALITY_THRESHOLD) {
    return rejectByDirigeant(target, `Score qualité inférieur au seuil de publication (${PUBLISH_QUALITY_THRESHOLD}/100).`, validatedBy);
  }

  return withRecord(target, "validated", comment, validatedBy, "validatedBy") as T;
}

export function rejectByDirigeant<T extends ValidatableTarget>(target: T, reason: string, rejectedBy = "Dirigeant BCVB") {
  const cleanReason = reason.trim();
  if (!cleanReason) {
    throw new Error("Un refus de validation doit contenir un motif.");
  }

  return withRecord(target, "to_correct", cleanReason, rejectedBy, "rejectedBy") as T;
}

export function requestCorrection<T extends ValidatableTarget>(target: T, reason: string, requestedBy = "Dirigeant BCVB") {
  const cleanReason = reason.trim();
  if (!cleanReason) {
    throw new Error("Une demande de correction doit contenir un motif.");
  }

  return withRecord(target, "to_correct", cleanReason, requestedBy, "requestedBy") as T;
}

export function publishAfterValidation<T extends ValidatableTarget>(target: T, publishedBy = "Admin BCVB") {
  if (qualityOf(target) < PUBLISH_QUALITY_THRESHOLD) {
    throw new Error(`Publication impossible : score qualité inférieur à ${PUBLISH_QUALITY_THRESHOLD}/100.`);
  }

  if (target.validationStatus !== "validated" && target.status !== "validated" && target.status !== "validé") {
    throw new Error("Publication impossible : validation préalable requise.");
  }

  return withRecord(target, "published", "Publication après validation.", publishedBy, "validatedBy") as T;
}

export function archiveValidatedTarget<T extends ValidatableTarget>(target: T, archivedBy = "Admin BCVB") {
  return withRecord(target, "archived", "Archivage sécurisé de l’élément validé.", archivedBy, "validatedBy") as T;
}
