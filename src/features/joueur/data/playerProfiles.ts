export type PlayerProfileLite = {
  id: string
  fullName: string
  categoryId: string
}

export const playerProfiles: PlayerProfileLite[] = [
  {
    id: 'player-001',
    fullName: 'Joueur Test U13',
    categoryId: 'U13',
  },
  {
    id: 'player-002',
    fullName: 'Joueur Test U11',
    categoryId: 'U11',
  },
  {
    id: 'player-003',
    fullName: 'Joueur Test U15',
    categoryId: 'U15',
  },
]