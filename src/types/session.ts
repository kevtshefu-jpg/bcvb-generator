import type { CategoryId, ThemeId } from "./referentiel";

export type SessionStep = "je découvre" | "je m'exerce" | "je retranscris" | "je régule";

export type CourtType = "half" | "full";

export type DiagramElementType =
  | "attacker"
  | "defender"
  | "coach"
  | "cone"
  | "ball"
  | "zone-label";

export interface DiagramElement {
  id: string;
  type: DiagramElementType;
  x: number;
  y: number;
  label?: string;
}

export type DiagramActionType = "move" | "pass" | "dribble" | "cut" | "shot" | "screen";

export interface Position {
  x: number;
  y: number;
}

export type Action = {
  type: "move" | "pass" | "dribble";
  from: Position;
  to: Position;
  playerId: string;
};

export interface DiagramAnchor {
  elementId?: string | null;
  x: number;
  y: number;
}

export interface DiagramAction {
  id: string;
  type: DiagramActionType;
  from: DiagramAnchor;
  to: DiagramAnchor;
  label?: string;
  order?: number;
}

export interface DiagramData {
  courtType: CourtType;
  elements: DiagramElement[];
  actions: DiagramAction[];
}

export type SessionUsageLevel =
  | "initiation"
  | "formation"
  | "perfectionnement"
  | "pré-compétition"
  | "compétition";

export type SessionGameFormat =
  | "1c0"
  | "1c1"
  | "2c1"
  | "2c2"
  | "3c3"
  | "4c4"
  | "5c5"
  | "atelier"
  | "jeu réduit"
  | "non précisé";

export interface SessionMetadata {
  subTheme: string;
  playerCount: number | null;
  gameFormat: SessionGameFormat;
  usageLevel: SessionUsageLevel;
  keywords: string[];
}

export interface SessionSourceImage {
  id: string;
  name: string;
  dataUrl: string;
  mimeType: string;
  width?: number;
  height?: number;
  page?: number | null;
  isPrimary?: boolean;
  kind?: "source" | "diagramme_pdf" | "illustration";
}

export interface ReconstructionPoint {
  id: string;
  label: string;
  x: number; // 0 -> 1
  y: number; // 0 -> 1
  color: string;
}

export interface ReconstructionState {
  activeSourceImageId: string | null;
  points: ReconstructionPoint[];
  notes: string;
}

export interface BCVBSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  category: string;
  durationMin: number;
  theme: string;
  step: SessionStep;
  philosophy: string;
  axes: string[];
  objective: string;
  intentions: string[];
  organization: string;
  equipment: string[];
  setup: string[];
  instructions: string[];
  variables: string[];
  successCriteria: string[];
  rawText: string;
  diagram: DiagramData;
  metadata: SessionMetadata;
  sourceImages: SessionSourceImage[];
  reconstruction: ReconstructionState;
}

export interface PdfParseResult {
  text: string;
  pageCount: number;
}

export type SessionBlockType =
  | "Mise en route"
  | "Apprentissage"
  | "Situation"
  | "Opposition"
  | "Transfert"
  | "Régulation";

export type SessionBlockSource = "manual" | "library" | "generator";

export type SessionBlock = {
  id: string;
  type: SessionBlockType;
  title: string;
  duration: number;
  objective: string;
  source: SessionBlockSource;
  sourceSituationId?: string;
  setup: string;
  instructions: string;
  successCriteria: string;
  variables: string;
  coachingPoints: string[];
  intentions: string[];
  material: string[];
  diagramSvgMarkup?: string;
};

export type SessionState = {
  id: string;
  title: string;
  categoryId: CategoryId;
  themeId: ThemeId;
  cycleStep: string;
  globalObjective: string;
  notes: string;
  blocks: SessionBlock[];
};
