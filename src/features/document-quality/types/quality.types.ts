export type DocumentFamily =
  | "guide_coach"
  | "cahier_technique"
  | "fiche_seance"
  | "situation_pedagogique"
  | "outil_evaluation"
  | "document_familles"
  | "document_administratif"
  | "compte_rendu"
  | "unknown";

export type PublicationStatus =
  | "non_publiable"
  | "a_corriger"
  | "publiable_avec_reserves"
  | "publiable"
  | "premium";

export interface QualityWarning {
  id: string;
  level: "info" | "warning" | "critical";
  category: string;
  message: string;
  targetBlockId?: string;
  fixable: boolean;
}

export interface QualityRecommendation {
  id: string;
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  expectedGain: number;
  fixAction: string;
}

export interface QualityEvidence {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface QualityScore {
  globalScore: number;
  status: PublicationStatus;
  family: DocumentFamily;
  structureScore: number;
  bcvbIdentityScore: number;
  pedagogicalScore: number;
  fieldUseScore: number;
  tableScore: number;
  situationScore: number;
  diagramScore: number;
  styleScore: number;
  exportReadinessScore: number;
  warnings: QualityWarning[];
  recommendations: QualityRecommendation[];
  evidence: QualityEvidence[];
  createdAt: string;
}

export type CorrectionMode =
  | "micro_correction"
  | "strong_improvement"
  | "publication_rebuild";

export interface CorrectionAction {
  id: string;
  type:
    | "restructure"
    | "add_missing_sections"
    | "improve_tables"
    | "improve_style"
    | "add_bcvb_identity"
    | "improve_situations"
    | "improve_export_readiness";
  description: string;
  expectedGain: number;
  requiresAi: boolean;
}

export interface CorrectionPlan {
  mode: CorrectionMode;
  targetScore: number;
  currentScore: number;
  actions: CorrectionAction[];
  estimatedGain: number;
  riskLevel: "low" | "medium" | "high";
  preservedItems: string[];
  restructuredItems: string[];
  risks: string[];
}

export interface MassiveCorrectionResult {
  mode: CorrectionMode;
  correctedSource: string;
  changeLog: string[];
  summary: string;
  previousScore?: QualityScore;
  newScore?: QualityScore;
}
