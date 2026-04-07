export type PlayerUnlockedContent = {
  playerId: string
  contentIds: string[]
}

export const playerUnlocksMock: PlayerUnlockedContent[] = [
  {
    playerId: 'player-001',
    contentIds: ['u13-1c1-contact-1'],
  },
  {
    playerId: 'player-002',
    contentIds: [],
  },
  {
    playerId: 'player-003',
    contentIds: ['u15-lecture-aide-1'],
  },
]