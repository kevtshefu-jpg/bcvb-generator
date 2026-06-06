export type CourtMode =
  | "full"
  | "half-left"
  | "half-right";

export type CourtObjectKind =
  | "player"
  | "defender"
  | "coach"
  | "cone"
  | "ball"
  | "text"
  | "zone"
  | "hands";

export type MotionKind =
  | "move"
  | "dribble"
  | "pass"
  | "screen";

export type ZoneShape =
  | "rect"
  | "rounded-rect"
  | "ellipse"
  | "polygon";

export interface CourtPoint {
  x: number;
  y: number;
}

export interface CourtObjectBase {
  id: string;
  kind: CourtObjectKind;
  x: number;
  y: number;
  color?: string;
  label?: string;
}

export interface PlayerObject extends CourtObjectBase {
  kind: "player" | "defender" | "coach";
  number?: string;
}

export interface ConeObject extends CourtObjectBase {
  kind: "cone";
}

export interface BallObject extends CourtObjectBase {
  kind: "ball";
}

export interface TextObject extends CourtObjectBase {
  kind: "text";
  text: string;
  fontSize?: number;
}

export interface HandsObject extends CourtObjectBase {
  kind: "hands";
}

export interface ZoneObject extends CourtObjectBase {
  kind: "zone";
  shape: ZoneShape;
  width: number;
  height: number;
  points?: CourtPoint[];
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
}

export type CourtObject =
  | PlayerObject
  | ConeObject
  | BallObject
  | TextObject
  | HandsObject
  | ZoneObject;

export interface MotionPath {
  id: string;
  kind: MotionKind;
  from: CourtPoint;
  to: CourtPoint;
  control?: CourtPoint | null;
  color?: string;
  strokeWidth?: number;
  curved?: boolean;
}

export interface CourtFrame {
  id: string;
  title: string;
  subtitle?: string;
  mode: CourtMode;
  showCenterLogo?: boolean;
  objects: CourtObject[];
  motions: MotionPath[];
}
