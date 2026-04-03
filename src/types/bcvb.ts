export type Category =
  | 'U7'
  | 'U9'
  | 'U11'
  | 'U13'
  | 'U15'
  | 'U18'
  | 'Seniors';

export type PedagogyStep =
  | 'decouvrir'
  | 'exercer'
  | 'retranscrire'
  | 'reguler';

export type SessionBlockType =
  | 'mise_en_route'
  | 'fondamental'
  | 'apprentissage'
  | 'opposition'
  | 'regulation';

export interface Situation {
  id: string;
  titre: string;
  categorie: Category[];
  etapePedagogique: PedagogyStep[];
  theme: string;
  sousTheme: string;
  duree: number;
  terrain: string;
  intensite: string;
  effectifMin: number;
  effectifMax: number;
  materiel: string[];
  tagsBCVB: string[];
  objectifs: string[];
  consignes: string[];
  pointsVigilance: string[];
}

export type BCVBSituation = Situation;

export interface GeneratorFilters {
  categorie: Category;
  theme: string;
  sousTheme?: string;
  etapePedagogique: PedagogyStep;
  intensite: string;
  effectif: number;
  materielDisponible: string[];
  dureeTotale: number;
}

export interface SessionBlock {
  ordre: number;
  typeBloc: SessionBlockType;
  titre: string;
  objectif: string;
  duree: number;
  situation: Situation;
  pointsCoaching: string[];
}

export interface GeneratedSession {
  titre: string;
  categorie: Category;
  theme: string;
  dureeTotale: number;
  effectif: number;
  etapePedagogique: PedagogyStep;
  intensite: string;
  blocs: SessionBlock[];
  notesCoach: string[];
}
