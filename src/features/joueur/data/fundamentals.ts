export type FondamentalKey =
  | 'dribble_main_forte'
  | 'dribble_main_faible'
  | 'passe'
  | 'tir_proche'
  | 'tir_loin'
  | 'finition'
  | 'appuis'
  | 'un_contre_un_offensif'
  | 'un_contre_un_defensif'
  | 'lecture_du_jeu'
  | 'rebond'

export type MasteryLevel = 0 | 1 | 2 | 3 | 4

export type FundamentalDefinition = {
  key: FondamentalKey
  title: string
  family: 'Offensif' | 'Défensif' | 'Lecture du jeu' | 'Athlétique'
  description: string
}

export const masteryLabels: Record<MasteryLevel, string> = {
  0: 'Non vu',
  1: 'Découverte',
  2: 'En cours',
  3: 'Maîtrisé en séance',
  4: 'Transféré en match',
}

export const fundamentals: FundamentalDefinition[] = [
  {
    key: 'dribble_main_forte',
    title: 'Dribble main forte',
    family: 'Offensif',
    description: 'Conduire la balle avec contrôle, vitesse et lecture.',
  },
  {
    key: 'dribble_main_faible',
    title: 'Dribble main faible',
    family: 'Offensif',
    description: 'Développer l’aisance et la sécurité sur main faible.',
  },
  {
    key: 'passe',
    title: 'Passe',
    family: 'Offensif',
    description: 'Donner juste, vite et dans le bon timing.',
  },
  {
    key: 'tir_proche',
    title: 'Tir proche',
    family: 'Offensif',
    description: 'Finir près du cercle avec équilibre et coordination.',
  },
  {
    key: 'tir_loin',
    title: 'Tir loin',
    family: 'Offensif',
    description: 'Structurer le geste et la stabilité à distance.',
  },
  {
    key: 'finition',
    title: 'Finition',
    family: 'Offensif',
    description: 'Conclure avec variété, rythme et adaptation.',
  },
  {
    key: 'appuis',
    title: 'Appuis',
    family: 'Athlétique',
    description: 'Coordination, équilibre, dissociation et changements de rythme.',
  },
  {
    key: 'un_contre_un_offensif',
    title: '1c1 offensif',
    family: 'Offensif',
    description: 'Créer un avantage, attaquer juste et finir.',
  },
  {
    key: 'un_contre_un_defensif',
    title: '1c1 défensif',
    family: 'Défensif',
    description: 'Contenir, orienter et défendre avec activité.',
  },
  {
    key: 'lecture_du_jeu',
    title: 'Lecture du jeu',
    family: 'Lecture du jeu',
    description: 'Voir avant d’agir, identifier les solutions utiles.',
  },
  {
    key: 'rebond',
    title: 'Rebond',
    family: 'Défensif',
    description: 'Prendre l’avantage de position et sécuriser la balle.',
  },
]