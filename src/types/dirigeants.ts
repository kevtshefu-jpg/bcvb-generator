import type { PlanningCategory, PlanningLevel, PlanningStatus } from "./planning";

export type ValidationStatus =
  | "draft"
  | "to_correct"
  | "ready_for_validation"
  | "in_dirigeant_validation"
  | "validated"
  | "published"
  | "archived";

export type DirigeantAction =
  | "view"
  | "comment"
  | "request_correction"
  | "validate"
  | "reject"
  | "export";

export interface DirigeantComment {
  id: string;
  targetId: string;
  targetType: "document" | "planning" | "team" | "quality_alert";
  authorId: string;
  authorName: string;
  role: "dirigeant" | "admin" | "responsable_technique";
  content: string;
  createdAt: string;
}

export interface ValidationRecord {
  id: string;
  targetId: string;
  targetType: "document" | "planning";
  status: ValidationStatus;
  requestedBy: string;
  validatedBy?: string;
  rejectedBy?: string;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DirigeantDashboardKPI {
  activeTeams: number;
  validatedPlannings: number;
  planningsToValidate: number;
  teamsWithoutPlanning: number;
  publishedDocuments: number;
  documentsToCorrect: number;
  missingAttendances: number;
  missingEvaluations: number;
  qualityAlerts: number;
}

export interface DirigeantPlanningSummary {
  id: string;
  title: string;
  teamId: string;
  teamName: string;
  category: PlanningCategory | string;
  level: PlanningLevel | string;
  season: string;
  coachName: string;
  technicalManager: string;
  status: PlanningStatus;
  validationStatus: ValidationStatus;
  currentCycle: string;
  nextCycle: string;
  mainObjectives: string[];
  linkedSessionsCount: number;
  completedSessionsCount: number;
  plannedWeeksCount: number;
  cyclesCount: number;
  coveredObjectives: number;
  uncoveredObjectives: number;
  realizationRate: number;
  qualityScore: number;
  coherence: {
    category: number;
    dlta: number;
    bcvb: number;
  };
  alerts: string[];
  comments: DirigeantComment[];
  exports: Array<{ label: string; path: string; type: "pdf" | "csv" | "markdown" }>;
}

export interface DirigeantDocumentSummary {
  id: string;
  title: string;
  family: string;
  category: string;
  status: ValidationStatus;
  publicationLevel: "draft" | "internal" | "club" | "official";
  qualityScore: number;
  updatedAt: string;
  route: string;
}

export interface DirigeantOrganisationSummary {
  teamId: string;
  teamName: string;
  category: string;
  level: string;
  mainGym: string;
  trainingSlots: string[];
  headCoach: string;
  assistantCoach?: string;
  parentReferent?: string;
  dirigeantReferent?: string;
  playersCount: number;
  constraints: string[];
  materialNeeds: string[];
  notes: string;
}

export interface DirigeantQualityAlert {
  id: string;
  title: string;
  targetId: string;
  targetType: "document" | "planning" | "team";
  severity: "faible" | "moyenne" | "haute";
  message: string;
  recommendedAction: string;
}

export interface DirigeantDashboardModel {
  kpi: DirigeantDashboardKPI;
  plannings: DirigeantPlanningSummary[];
  documents: DirigeantDocumentSummary[];
  organisation: DirigeantOrganisationSummary[];
  qualityAlerts: DirigeantQualityAlert[];
}
