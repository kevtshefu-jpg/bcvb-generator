export type EvaluationScore = 1 | 2 | 3 | 4 | 5;

export type EvaluationDomainKey =
  | "intensite"
  | "agressivite_maitrisee"
  | "maitrise"
  | "jeu"
  | "fondamentaux_offensifs"
  | "fondamentaux_defensifs"
  | "lecture_jeu"
  | "attitude_collective"
  | "autonomie"
  | "assiduite";

export type EvaluationDomain = EvaluationDomainKey
  | "collectif"
  | "mental"
  | "physique";

export type LegacyEvaluationDomain =
  | "intensite"
  | "agressivite_maitrisee"
  | "maitrise"
  | "jeu"
  | "fondamentaux_offensifs"
  | "fondamentaux_defensifs"
  | "collectif"
  | "mental"
  | "physique"
  | "autonomie";

export type EvaluationPeriod =
  | "debut_saison"
  | "mensuel"
  | "ponctuel"
  | "trimestre_1"
  | "trimestre_2"
  | "trimestre_3"
  | "mi_saison"
  | "fin_saison"
  | "stage"
  | "detection"
  | "bilan_libre";

export type EvaluationAudience =
  | "coach"
  | "joueur"
  | "famille"
  | "responsable_technique"
  | "dirigeant";

export interface EvaluationCriterion {
  id: string;
  domain: EvaluationDomain;
  label: string;
  description: string;
  observable: string;
  score?: EvaluationScore;
  comment?: string;
  category?: string;
  level?: string;
  weight?: number;
}

export interface PlayerEvaluationScore {
  criterionId: string;
  score: EvaluationScore;
  comment?: string;
  observableEvidence?: string;
}

export interface PlayerEvaluation {
  id: string;
  playerId: string;
  teamId: string;
  category: string;
  period: EvaluationPeriod;
  date?: string;
  season: string;
  createdBy: string;
  criteria?: EvaluationCriterion[];
  scores: PlayerEvaluationScore[];
  strengths: string[];
  priorities: string[];
  priorityAxis?: string;
  monthlyChallenge?: string;
  nextStep?: string;
  globalComment?: string;
  coachComment: string;
  playerFeedback?: string;
  parentFeedback?: string;
  individualObjective?: IndividualObjective;
  visibleToPlayer?: boolean;
  visibleToFamily?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IndividualObjective {
  id: string;
  playerId: string;
  title: string;
  domain: EvaluationDomain;
  target?: string;
  targetDescription: string;
  observableCriterion: string;
  quantifiableCriterion?: string;
  deadline?: string;
  linkedSessions?: string[];
  linkedSessionIds?: string[];
  status: "a_travailler" | "en_cours" | "valide" | "abandonne";
}

export interface EvaluationObjective {
  id: string;
  playerId: string;
  title: string;
  domain: EvaluationDomainKey;
  target: string;
  observableCriterion: string;
  quantifiableCriterion?: string;
  deadline?: string;
  status: "a_travailler" | "en_cours" | "valide" | "abandonne";
  linkedSessionIds?: string[];
}

export interface PlayerEvaluationSummary {
  playerId: string;
  globalScore: number;
  domainScores: Record<EvaluationDomain, number>;
  strongestDomains: EvaluationDomain[];
  priorityDomains: EvaluationDomain[];
  recommendation: string;
}

export interface EvaluationStats {
  playerId?: string;
  teamId?: string;
  periodLabel: string;
  averageScore: number;
  domainScores: Record<EvaluationDomainKey, number>;
  strongestDomains: EvaluationDomainKey[];
  priorityDomains: EvaluationDomainKey[];
  progressionRate?: number;
}

export interface EvaluationTemplate {
  id: string;
  category: string;
  level?: string;
  title: string;
  description: string;
  criteria: EvaluationCriterion[];
}

export interface TeamEvaluationSummary {
  teamId: string;
  period: EvaluationPeriod;
  season: string;
  playersCount: number;
  teamGlobalScore: number;
  domainAverages: Record<EvaluationDomain, number>;
  teamStrengths: string[];
  teamPriorities: string[];
  playersToSupport: string[];
  planningRecommendations: string[];
}

export type EvaluationPlayer = {
  id: string;
  firstName: string;
  lastName: string;
  category: string;
  teamId: string;
  teamName: string;
  position?: string;
  attendanceRate?: number;
  lastEvaluationDate?: string;
};

export type EvaluationTeam = {
  id: string;
  name: string;
  category: string;
  level: string;
};

export type EvaluationPermissionSet = {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewSensitiveCoachComments: boolean;
  canExport: boolean;
  canShareWithFamily: boolean;
  aggregateOnly: boolean;
};

export type EvaluationsDashboardData = {
  evaluatedPlayersRate?: number;
  completedEvaluations: number;
  missingEvaluations: number;
  teamAverageScores?: Array<{ teamId: string; score: number }>;
  priorityDomainsByTeam?: Array<{ teamId: string; domains: EvaluationDomain[] }>;
  activeIndividualObjectives?: number;
  playersInStrongProgression?: string[];
  strongDomainsByTeam: Array<{ teamId: string; domain: EvaluationDomain; score: number }>;
  weakDomainsByCategory: Array<{ category: string; domain: EvaluationDomain; score: number }>;
  openIndividualObjectives: number;
  playersWithoutRecentReport: string[];
};
