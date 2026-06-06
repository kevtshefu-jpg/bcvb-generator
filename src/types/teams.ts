export type TeamGender = "masculin" | "feminin" | "mixte";

export type TeamStatus = "active" | "archived" | "draft" | "preparation" | "brouillon" | "actif" | "archive";

export type TeamLevel =
  | "departemental"
  | "regional"
  | "interdepartemental"
  | "national"
  | "loisir"
  | "section_sportive"
  | "ecole_basket"
  | "autre"
  | string;

export type TeamStaffRole =
  | "head_coach"
  | "coach_principal"
  | "assistant_coach"
  | "aide_coach"
  | "physical_trainer"
  | "preparateur_physique"
  | "parent_referent"
  | "dirigeant_referent"
  | "technical_manager"
  | "responsable_technique"
  | "otm_referent"
  | "arbitre_referent"
  | "autre"
  | "other";

export type TeamObjectiveType =
  | "sportif"
  | "pedagogique"
  | "comportemental"
  | "defensif"
  | "offensif"
  | "collectif"
  | "individuel_prioritaire"
  | "identite_bcvb"
  | "defense_homme_a_homme"
  | "style_de_jeu"
  | "priorite_cycle"
  | "vie_de_groupe";

export interface TeamProfile {
  id: string;
  name: string;
  category: string;
  gender?: TeamGender;
  level: TeamLevel;
  championship?: string;
  season: string;
  status: TeamStatus;
  mainGym?: string;
  trainingSlots?: Array<string | TeamTrainingSlot>;
  identityTags?: string[];
  styleOfPlay?: string;
  defensiveIdentity?: string;
  mainObjective?: string;
  technicalPriority?: string;
  behavioralPriority?: string;
  collectivePriority?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamTrainingSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  gym: string;
  type: "entrainement" | "optionnel" | "physique" | "section" | "autre";
}

export type TeamPermission =
  | "view_team"
  | "edit_team"
  | "manage_roster"
  | "create_sessions"
  | "edit_sessions"
  | "manage_attendance"
  | "manage_evaluations"
  | "view_private_documents"
  | "export_team"
  | "archive_team";

export interface TeamStaffMember {
  id: string;
  teamId: string;
  userId?: string;
  displayName?: string;
  name: string;
  email?: string;
  phone?: string;
  role: TeamStaffRole;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  permissions?: TeamPermission[];
}

export interface TeamObjective {
  id: string;
  teamId: string;
  season: string;
  type: TeamObjectiveType;
  title: string;
  description: string;
  observableCriteria?: string | string[];
  quantifiableCriteria?: string | string[];
  priority: "basse" | "moyenne" | "haute";
  status: "a_faire" | "a_travailler" | "en_cours" | "atteint" | "abandonne";
  linkedPlanningId?: string;
  linkedPlanningIds?: string[];
  linkedEvaluationIds?: string[];
}

export interface TeamLinkedDocument {
  id: string;
  teamId: string;
  documentId: string;
  documentType:
    | "session"
    | "seance"
    | "planning"
    | "planification"
    | "evaluation"
    | "presence"
    | "effectif"
    | "bilan"
    | "cahier_technique"
    | "guide_coach"
    | "document"
    | "export"
    | "autre";
  title: string;
  url?: string;
  visibility?: "admin" | "staff" | "club" | "public";
  createdAt: string;
}

export interface TeamSeasonHistory {
  id: string;
  teamId: string;
  season: string;
  summary: string;
  finalLevel?: string;
  keyPlayers?: string[];
  staff?: string[];
  strengths?: string[];
  priorities?: string[];
  archivedAt?: string;
}

export interface TeamHistoryEntry {
  id: string;
  teamId: string;
  season: string;
  title: string;
  description: string;
  type:
    | "bilan_saison"
    | "objectif"
    | "staff"
    | "effectif"
    | "competition"
    | "document"
    | "incident"
    | "reussite"
    | "autre";
  createdAt: string;
  createdBy: string;
}

export interface TeamStats {
  teamId: string;
  season: string;
  playersCount: number;
  staffCount: number;
  sessionsCount: number;
  attendanceRate?: number;
  evaluationsCount?: number;
  documentsCount: number;
  activeObjectivesCount: number;
  reachedObjectivesCount?: number;
  averageProgression?: number;
}

export type TeamIndicators = {
  playersCount: number;
  nextSessions: number;
  averageAttendanceRate: number;
  averageEvaluationScore: number;
  objectivesProgressRate: number;
  sessionsCreated: number;
  attendancesFilled: number;
  evaluationsCompleted: number;
  linkedDocumentsCount: number;
  alerts: string[];
};

export type TeamDashboardData = {
  activeTeamsCount: number;
  teamsWithoutHeadCoach: number;
  teamsWithoutSeasonObjectives: number;
  teamsWithoutActivePlanning: number;
  teamsWithMissingAttendance: number;
  teamsWithoutRecentEvaluation: number;
  teamsWithMissingDocuments: number;
  teamsToArchive: number;
  nextDeadlines: Array<{ teamId: string; teamName: string; label: string; date: string }>;
};

export type TeamPermissionSet = {
  canView: boolean;
  canEdit: boolean;
  canManageStaff: boolean;
  canManageRoster: boolean;
  canManageObjectives: boolean;
  canViewEvaluations: boolean;
  canExport: boolean;
  canArchive: boolean;
  canDelete: boolean;
  canViewSensitiveTechnicalData: boolean;
  readOnly: boolean;
};
