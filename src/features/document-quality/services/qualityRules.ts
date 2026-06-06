import type { DocumentFamily, PublicationStatus } from "../types/quality.types";

export type QualityWeightKey =
  | "structureScore"
  | "bcvbIdentityScore"
  | "pedagogicalScore"
  | "fieldUseScore"
  | "tableScore"
  | "situationScore"
  | "diagramScore"
  | "styleScore"
  | "exportReadinessScore";

export const familyLabels: Record<DocumentFamily, string> = {
  guide_coach: "Guide coach",
  cahier_technique: "Cahier technique",
  fiche_seance: "Fiche séance",
  situation_pedagogique: "Situation pédagogique",
  outil_evaluation: "Outil d’évaluation",
  document_familles: "Document familles",
  document_administratif: "Document administratif",
  compte_rendu: "Compte rendu",
  unknown: "Document BCVB",
};

export const qualityWeights: Record<DocumentFamily, Record<QualityWeightKey, number>> = {
  guide_coach: {
    structureScore: 13,
    bcvbIdentityScore: 14,
    pedagogicalScore: 14,
    fieldUseScore: 12,
    tableScore: 8,
    situationScore: 12,
    diagramScore: 8,
    styleScore: 10,
    exportReadinessScore: 9,
  },
  cahier_technique: {
    structureScore: 12,
    bcvbIdentityScore: 12,
    pedagogicalScore: 12,
    fieldUseScore: 14,
    tableScore: 10,
    situationScore: 15,
    diagramScore: 13,
    styleScore: 6,
    exportReadinessScore: 6,
  },
  fiche_seance: {
    structureScore: 14,
    bcvbIdentityScore: 10,
    pedagogicalScore: 12,
    fieldUseScore: 18,
    tableScore: 5,
    situationScore: 15,
    diagramScore: 12,
    styleScore: 6,
    exportReadinessScore: 8,
  },
  situation_pedagogique: {
    structureScore: 12,
    bcvbIdentityScore: 12,
    pedagogicalScore: 14,
    fieldUseScore: 18,
    tableScore: 4,
    situationScore: 18,
    diagramScore: 12,
    styleScore: 5,
    exportReadinessScore: 5,
  },
  outil_evaluation: {
    structureScore: 12,
    bcvbIdentityScore: 10,
    pedagogicalScore: 12,
    fieldUseScore: 10,
    tableScore: 18,
    situationScore: 6,
    diagramScore: 4,
    styleScore: 10,
    exportReadinessScore: 18,
  },
  document_familles: {
    structureScore: 16,
    bcvbIdentityScore: 10,
    pedagogicalScore: 8,
    fieldUseScore: 7,
    tableScore: 8,
    situationScore: 4,
    diagramScore: 3,
    styleScore: 22,
    exportReadinessScore: 22,
  },
  document_administratif: {
    structureScore: 18,
    bcvbIdentityScore: 5,
    pedagogicalScore: 4,
    fieldUseScore: 4,
    tableScore: 18,
    situationScore: 2,
    diagramScore: 2,
    styleScore: 20,
    exportReadinessScore: 27,
  },
  compte_rendu: {
    structureScore: 18,
    bcvbIdentityScore: 8,
    pedagogicalScore: 8,
    fieldUseScore: 8,
    tableScore: 10,
    situationScore: 6,
    diagramScore: 2,
    styleScore: 20,
    exportReadinessScore: 20,
  },
  unknown: {
    structureScore: 14,
    bcvbIdentityScore: 12,
    pedagogicalScore: 10,
    fieldUseScore: 10,
    tableScore: 10,
    situationScore: 10,
    diagramScore: 8,
    styleScore: 13,
    exportReadinessScore: 13,
  },
};

export function getPublicationStatus(score: number, criticalWarnings: number): PublicationStatus {
  if (criticalWarnings > 0) return score < 50 ? "non_publiable" : "a_corriger";
  if (score < 50) return "non_publiable";
  if (score < 70) return "a_corriger";
  if (score < 85) return "publiable_avec_reserves";
  if (score < 95) return "publiable";
  return "premium";
}

export function statusLabel(status: PublicationStatus) {
  if (status === "non_publiable") return "Non publiable";
  if (status === "a_corriger") return "À corriger";
  if (status === "publiable_avec_reserves") return "Publiable avec réserves";
  if (status === "publiable") return "Publiable";
  return "Premium";
}
