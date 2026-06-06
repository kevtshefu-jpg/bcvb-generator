export type UserRole =
  | "admin"
  | "responsable_technique"
  | "coach"
  | "dirigeant"
  | "parent_referent"
  | "membre";

export type PermissionKey =
  | "dashboard.view"
  | "documents.view"
  | "documents.create"
  | "documents.edit"
  | "documents.delete"
  | "documents.publish"
  | "documents.export"
  | "studio.use"
  | "studio.admin"
  | "sessions.view"
  | "sessions.create"
  | "sessions.edit.own"
  | "sessions.edit.all"
  | "sessions.delete.own"
  | "sessions.delete.all"
  | "sessions.export"
  | "planning.view"
  | "planning.create"
  | "planning.edit.own"
  | "planning.edit.all"
  | "rosters.view"
  | "rosters.import"
  | "rosters.edit"
  | "attendance.view"
  | "attendance.edit"
  | "evaluations.view"
  | "evaluations.edit"
  | "parents.view"
  | "dirigeants.view"
  | "faq.view"
  | "tutorials.view"
  | "ocr.use"
  | "quality.view"
  | "quality.run"
  | "admin.settings";

export type DocumentFamily =
  | "cahier_technique"
  | "guide_coach"
  | "plan_formation"
  | "ruban_pedagogique"
  | "seance_entrainement"
  | "fiche_theme";

export type ReferentialKey =
  | "bcvb"
  | "ffbb"
  | "fiba"
  | "europe"
  | "usa"
  | "canada"
  | "specific_sources";

export interface RolePermissionConfig {
  role: UserRole;
  label: string;
  description: string;
  permissions: PermissionKey[];
}

export interface SeasonConfig {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  active: boolean;
  archived: boolean;
}

export interface DocumentStandardConfig {
  family: DocumentFamily;
  label: string;
  minQualityScore: number;
  minTables: number;
  minSituations: number;
  minDiagrams: number;
  minBcvbBlocks: number;
  requiresCover: boolean;
  requiresSummary: boolean;
  requiresEvaluationGrid: boolean;
  requiresExport: boolean;
  layoutSignature: string;
}

export interface ReferentialConfig {
  key: ReferentialKey;
  label: string;
  description: string;
  enabled: boolean;
  injectInPrompt: boolean;
}

export interface ExportConfig {
  family: DocumentFamily;
  format: "a4_portrait" | "a4_landscape" | "custom";
  includeLogo: boolean;
  includeFooter: boolean;
  includePageNumbers: boolean;
  includeSourceMarkdown: boolean;
  marginTopMm: number;
  marginRightMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
}

export interface AdminPlatformConfig {
  roles: RolePermissionConfig[];
  seasons: SeasonConfig[];
  documentStandards: DocumentStandardConfig[];
  referentials: ReferentialConfig[];
  exports: ExportConfig[];
}
