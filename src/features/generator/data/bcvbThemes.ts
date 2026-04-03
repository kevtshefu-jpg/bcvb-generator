export interface BCVBTheme {
  id: string;
  label: string;
  sousThemes: string[];
}

export const BCVB_THEMES: BCVBTheme[] = [
  {
    id: 'jeu-rapide',
    label: 'Jeu rapide',
    sousThemes: ['Transition 2c1', 'Transition 3c2', 'Run-out'],
  },
  {
    id: 'tir',
    label: 'Tir',
    sousThemes: ['Lay-up', 'Tir mi-distance', 'Pull-up', 'Floater'],
  },
  {
    id: '1c1',
    label: '1c1',
    sousThemes: ['1c1 face', '1c1 dos au panier', '1c1 sur catch'],
  },
  {
    id: 'passe',
    label: 'Passe',
    sousThemes: ['Passe en mouvement', 'Passe pénétrante', 'Skip pass'],
  },
  {
    id: 'defense',
    label: 'Défense',
    sousThemes: ['Défense sur porteur', 'Défense sans ballon', 'Aide et retour'],
  },
  {
    id: 'aisance-ballon',
    label: 'Aisance avec ballon',
    sousThemes: ['Manipulation', 'Dribble tête levée', 'Changement de direction'],
  },
];
