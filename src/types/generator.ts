import type { CategoryId, PedagogicStep, ThemeId } from "./referentiel";

export type ToolType =
  | "select"
  | "attacker"
  | "defender"
  | "coach"
  | "cone"
  | "ball"
  | "move"
  | "pass"
  | "dribble"
  | "screen"
  | "shot";

export type Position = {
  x: number;
  y: number;
};

export type NodeKind = "attacker" | "defender" | "coach" | "cone" | "ball";

export type CourtNode = {
  id: string;
  kind: NodeKind;
  label?: string;
  position: Position;
};

export type ActionKind = "move" | "pass" | "dribble" | "screen" | "shot";

export type CourtAction = {
  id: string;
  kind: ActionKind;
  fromNodeId?: string;
  toNodeId?: string;
};

export type GeneratorMeta = {
  title: string;
  categoryId: CategoryId;
  themeId: ThemeId;
  step: PedagogicStep;
  duration: number;
  players: number;
  baskets: number;
  objective: string;
  intentions: string[];
  coachingPoints: string[];
  material: string[];
  setup: string;
  instructions: string;
  successCriteria: string;
  variables: string;
};

export type GeneratorState = {
  selectedTool: ToolType;
  selectedNodeId: string | null;
  selectedActionId: string | null;
  meta: GeneratorMeta;
  nodes: CourtNode[];
  actions: CourtAction[];
};
