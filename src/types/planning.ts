export type PlanningCategory =
  | "U7"
  | "U9"
  | "U11"
  | "U13"
  | "U15"
  | "U18"
  | "U21"
  | "Seniors"
  | "Général BCVB";

export type PlanningLevel =
  | "Découverte"
  | "Départemental"
  | "Région"
  | "Pré-région"
  | "Performance"
  | "Loisir"
  | "Section sportive";

export type CoachProfile =
  | "Débutant"
  | "Intermédiaire"
  | "Confirmé"
  | "Responsable technique";

export type PlanningStatus =
  | "brouillon"
  | "en construction"
  | "proposée"
  | "à valider"
  | "validée technique"
  | "en validation dirigeant"
  | "validé"
  | "publié"
  | "archivé";

export type CycleStatus =
  | "brouillon"
  | "en cours"
  | "validé"
  | "verrouillé";

export interface PlanningObjective {
  id: string;
  label: string;
  description?: string;
  priority: "haute" | "moyenne" | "basse";
  observableCriteria: string[];
  quantifiableCriteria: string[];
  bcvbLink: string;
}

export interface PlanningWeek {
  id: string;
  weekNumber: number;
  dateLabel?: string;
  theme: string;
  priority: string;
  objectives: PlanningObjective[];
  linkedSessionIds: string[];
  coachNotes?: string;
  technicalManagerNotes?: string;
  validationCriteria: string[];
}

export interface PlanningCycle {
  id: string;
  title: string;
  durationWeeks: number;
  startWeek: number;
  endWeek: number;
  theme: string;
  bcvbPriority: string;
  objectives: PlanningObjective[];
  weeks: PlanningWeek[];
  status: CycleStatus;
  locked?: boolean;
}

export interface PlanningVersion {
  id: string;
  createdAt: string;
  createdBy: string;
  comment: string;
  snapshot: AnnualPlanning;
}

export interface AnnualPlanning {
  id: string;
  title: string;
  category: PlanningCategory;
  level: PlanningLevel;
  coachProfile: CoachProfile;
  teamName?: string;
  season: string;
  trainingFrequencyPerWeek: number;
  matchLevel?: string;
  constraints: string[];
  globalObjectives: PlanningObjective[];
  cycles: PlanningCycle[];
  status: PlanningStatus;
  createdBy: string;
  updatedAt: string;
  versions: PlanningVersion[];
}

export type PlanningBuilderInput = {
  teamName: string;
  season: string;
  category: PlanningCategory;
  level: PlanningLevel;
  coachProfile: CoachProfile;
  trainingFrequencyPerWeek: number;
  matchLevel: string;
  constraints: string[];
  createdBy?: string;
};
