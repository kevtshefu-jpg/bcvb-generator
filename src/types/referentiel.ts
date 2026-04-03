export type CategoryId = "U7" | "U9" | "U11" | "U13" | "U15" | "U18" | "SENIORS";

export type ThemeId =
  | "mini-basket"
  | "aisance-ballon"
  | "tir"
  | "jeu-rapide"
  | "defense-jeune-joueur"
  | "methodologie-coach";

export type PedagogicStep =
  | "Je découvre"
  | "Je m'exerce"
  | "Je retranscris"
  | "Je régule";

export type SituationLevel = "Débutant" | "Intermédiaire" | "Avancé";

export type SituationCourtType = "Demi-terrain" | "Plein terrain";

export type CategoryRecord = {
  id: CategoryId;
  title: string;
  ageLabel: string;
  finality: string;
  profile: string;
  priorities: string[];
  offensiveTargets: string[];
  defensiveTargets: string[];
  coachingPoints: string[];
  nextStep: string;
};

export type ThemeRecord = {
  id: ThemeId;
  title: string;
  summary: string;
  pillars: string[];
  coachingFocus: string[];
};

export type SituationRecord = {
  id: string;
  title: string;
  categoryIds: CategoryId[];
  themeIds: ThemeId[];
  pedagogicStep: PedagogicStep;
  level: SituationLevel;
  durationMin: number;
  playersMin: number;
  playersMax: number;
  courtType: SituationCourtType;
  materials: string[];
  objective: string;
  setup: string;
  instructions: string;
  successCriteria: string[];
  variables: string[];
  coachingPoints: string[];
  tags: string[];
};

export interface Category {
  id: CategoryId;
  title: string;
  description: string;
}

export interface Theme {
  id: string;
  title: string;
  description: string;
}

export interface SituationItem {
  id: string;
  title: string;
  category: CategoryId;
  theme: string;
  pedagogyStep: 'decouvrir' | 'exercer' | 'retranscrire' | 'reguler';
  durationMin: number;
  objective: string;
  tags: string[];
}

export interface ReferentielPageLink {
  id: string;
  title: string;
  path: string;
  description?: string;
}
