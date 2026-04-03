import type { Category, PedagogyStep } from '../../../types/bcvb';
import type { Action } from '../../../types/session';

export type { Category, PedagogyStep };

export type ToolMode = 'select' | 'move' | 'pass' | 'dribble' | 'tir' | 'ecran';

export interface PlayerToken {
  id: string;
  team: 'attaque' | 'defense';
  x: number;
  y: number;
  label?: string;
}

export interface GeneratorState {
  /* meta */
  nom: string;
  categorie: Category | '';
  theme: string;
  etapePedagogique: PedagogyStep | '';
  objectif: string;
  tags: string[];
  setup?: string;
  instructions?: string;
  successCriteria?: string;
  variables?: string;
  /* court */
  players: PlayerToken[];
  actions: Action[];
  activeTool: ToolMode;
  /* coaching */
  coachingPoints: string[];
}

export type GeneratorAction =
  | { type: 'SET_META'; payload: Partial<Pick<GeneratorState, 'nom' | 'categorie' | 'theme' | 'etapePedagogique' | 'objectif' | 'tags' | 'setup' | 'instructions' | 'successCriteria' | 'variables'>> }
  | { type: 'SET_TOOL'; payload: ToolMode }
  | { type: 'ADD_PLAYER'; payload: PlayerToken }
  | { type: 'MOVE_PLAYER'; payload: { id: string; x: number; y: number } }
  | { type: 'REMOVE_PLAYER'; payload: string }
  | { type: 'ADD_ACTION'; payload: Action }
  | { type: 'CLEAR_ACTIONS' }
  | { type: 'SET_COACHING_POINTS'; payload: string[] }
  | { type: 'RESET' };
