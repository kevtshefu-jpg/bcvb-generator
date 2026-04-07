export type PlayerContentItem = {
  id: string
  title: string
  theme: string
  categoryIds: string[]
  unlockedByCoachOnly: boolean
  description: string
}

export const playerContents: PlayerContentItem[] = [
  {
    id: 'u11-dribble-lecture-1',
    title: 'Dribbler en prenant des informations',
    theme: 'Lecture du jeu',
    categoryIds: ['U11'],
    unlockedByCoachOnly: false,
    description: 'Lever la tête, coordonner dribble et prise d’informations.',
  },
  {
    id: 'u11-passe-mouvement-1',
    title: 'Passer juste après déplacement',
    theme: 'Passe',
    categoryIds: ['U11'],
    unlockedByCoachOnly: false,
    description: 'Mettre de la justesse technique après course ou arrêt.',
  },
  {
    id: 'u13-1c1-contact-1',
    title: '1c1 avec gestion du contact',
    theme: '1c1 offensif',
    categoryIds: ['U13'],
    unlockedByCoachOnly: true,
    description: 'Utiliser le contact de manière maîtrisée pour finir.',
  },
  {
    id: 'u15-lecture-aide-1',
    title: 'Lecture aide / aide du défenseur',
    theme: 'Lecture du jeu',
    categoryIds: ['U15'],
    unlockedByCoachOnly: true,
    description: 'Identifier l’aide défensive et faire le bon choix.',
  },
]