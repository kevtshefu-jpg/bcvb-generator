import type { DocumentFamily, DocumentStandardConfig } from "../../types/admin";

export const documentFamilyLabels: Record<DocumentFamily, string> = {
  cahier_technique: "Cahier technique",
  guide_coach: "Guide du coach",
  plan_formation: "Plan de formation",
  ruban_pedagogique: "Ruban pédagogique",
  seance_entrainement: "Séance d’entraînement",
  fiche_theme: "Fiche à thème",
};

export const defaultDocumentStandards: DocumentStandardConfig[] = [
  {
    family: "cahier_technique",
    label: "Cahier technique",
    minQualityScore: 97,
    minTables: 2,
    minSituations: 4,
    minDiagrams: 3,
    minBcvbBlocks: 8,
    requiresCover: true,
    requiresSummary: true,
    requiresEvaluationGrid: true,
    requiresExport: true,
    layoutSignature: "premium-reference",
  },
  {
    family: "guide_coach",
    label: "Guide du coach",
    minQualityScore: 95,
    minTables: 1,
    minSituations: 3,
    minDiagrams: 2,
    minBcvbBlocks: 7,
    requiresCover: true,
    requiresSummary: true,
    requiresEvaluationGrid: false,
    requiresExport: true,
    layoutSignature: "coach-field-guide",
  },
  {
    family: "plan_formation",
    label: "Plan de formation",
    minQualityScore: 96,
    minTables: 3,
    minSituations: 2,
    minDiagrams: 1,
    minBcvbBlocks: 8,
    requiresCover: true,
    requiresSummary: true,
    requiresEvaluationGrid: true,
    requiresExport: true,
    layoutSignature: "season-roadmap",
  },
  {
    family: "ruban_pedagogique",
    label: "Ruban pédagogique",
    minQualityScore: 95,
    minTables: 2,
    minSituations: 2,
    minDiagrams: 1,
    minBcvbBlocks: 6,
    requiresCover: false,
    requiresSummary: true,
    requiresEvaluationGrid: false,
    requiresExport: true,
    layoutSignature: "progression-band",
  },
  {
    family: "seance_entrainement",
    label: "Séance d’entraînement",
    minQualityScore: 92,
    minTables: 1,
    minSituations: 3,
    minDiagrams: 2,
    minBcvbBlocks: 5,
    requiresCover: false,
    requiresSummary: false,
    requiresEvaluationGrid: false,
    requiresExport: true,
    layoutSignature: "field-session",
  },
  {
    family: "fiche_theme",
    label: "Fiche à thème",
    minQualityScore: 94,
    minTables: 1,
    minSituations: 2,
    minDiagrams: 1,
    minBcvbBlocks: 5,
    requiresCover: false,
    requiresSummary: true,
    requiresEvaluationGrid: false,
    requiresExport: true,
    layoutSignature: "theme-sheet",
  },
];

export function updateDocumentStandardNumber(
  standard: DocumentStandardConfig,
  key: keyof Pick<
    DocumentStandardConfig,
    "minQualityScore" | "minTables" | "minSituations" | "minDiagrams" | "minBcvbBlocks"
  >,
  value: number
) {
  return {
    ...standard,
    [key]: Math.max(0, value),
  };
}
