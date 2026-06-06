export type DirectorAccessRole =
  | "admin"
  | "president"
  | "vice_president"
  | "secretary"
  | "treasurer"
  | "sport_commission"
  | "technical_manager"
  | "director_readonly";

export type DirectorDocumentStatus =
  | "published"
  | "pending_validation"
  | "to_correct"
  | "not_publishable"
  | "archived";

export interface DirectorDashboardIndicator {
  id: string;
  label: string;
  value: number | string;
  status: "ok" | "warning" | "critical" | "info";
  description?: string;
  actionLabel?: string;
  actionTarget?: string;
}

export interface DirectorDocumentView {
  id: string;
  title: string;
  family: string;
  category?: string;
  season?: string;
  status: DirectorDocumentStatus;
  qualityScore?: number;
  publishedAt?: string;
  updatedAt?: string;
  validatedBy?: string;
  canDownloadPdf: boolean;
  canViewSource: boolean;
  canValidate: boolean;
}

export interface DirectorTeamOverview {
  id: string;
  name: string;
  category: string;
  level?: string;
  season: string;
  headCoach?: string;
  assistantCoach?: string;
  parentReferent?: string;
  directorReferent?: string;
  playersCount: number;
  targetPlayersCount?: number;
  planningStatus: "missing" | "draft" | "validated" | "published";
  presenceStatus: "up_to_date" | "late" | "missing";
  evaluationStatus: "up_to_date" | "late" | "missing";
  alerts: string[];
}

export interface DirectorPlanningOverview {
  id: string;
  teamId: string;
  teamName: string;
  category: string;
  season: string;
  status: "missing" | "draft" | "validated" | "published" | "archived";
  currentCycle?: string;
  objectivesCount: number;
  linkedSessionsCount: number;
  completionRate?: number;
}

export interface DirectorSpaceBlock {
  id: string;
  title: string;
  whyFor: string;
  why: string;
  quickAccess: string;
  indicators: DirectorDashboardIndicator[];
  status: "À suivre" | "Stable" | "Prioritaire" | "À valider";
  recommendedAction: string;
}

export interface DirectorSpaceModel {
  indicators: DirectorDashboardIndicator[];
  blocks: DirectorSpaceBlock[];
  teams: DirectorTeamOverview[];
  documents: DirectorDocumentView[];
  plannings: DirectorPlanningOverview[];
  qualityComments: Array<{ id: string; author: string; target: string; comment: string; createdAt: string }>;
}
