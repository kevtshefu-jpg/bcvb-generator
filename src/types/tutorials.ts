export type TutorialAudience =
  | "admin"
  | "responsable_technique"
  | "coach"
  | "dirigeant"
  | "parent_referent"
  | "membre"
  | "tous";

export type TutorialCategory =
  | "studio_editorial"
  | "createur_seance"
  | "import_effectifs"
  | "presences_evaluations"
  | "bibliotheque"
  | "exports"
  | "ocr_pieces_jointes"
  | "roles_permissions"
  | "faq";

export type TutorialLevel = "débutant" | "intermédiaire" | "avancé";

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  actionLabel?: string;
  expectedResult?: string;
  warning?: string;
}

export interface TutorialItem {
  id: string;
  title: string;
  subtitle: string;
  category: TutorialCategory;
  audience: TutorialAudience[];
  level: TutorialLevel;
  estimatedTime: string;
  priority: "haute" | "moyenne" | "basse";
  impact: "très fort" | "fort" | "moyen" | "faible";
  complexity: "faible" | "moyenne" | "élevée";
  status: "à créer" | "en cours" | "publié";
  why: string;
  forWhat: string;
  how: string;
  evolution: string;
  implementation: string;
  steps: TutorialStep[];
  checklist: string[];
  relatedRoutes: string[];
}

export interface TutorialProgressState {
  completedSteps: Record<string, string[]>;
  completedChecklistItems: Record<string, string[]>;
}

export interface TutorialRoleCapability {
  module: string;
  admin: string;
  responsable_technique: string;
  coach: string;
  dirigeant: string;
  parent_referent: string;
  membre: string;
}
