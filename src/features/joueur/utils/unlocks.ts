import type { PlayerUnlockedContent } from '../data/unlocks'

export function getUnlockedContentIds(
  unlocks: PlayerUnlockedContent[],
  playerId: string
) {
  return unlocks.find((entry) => entry.playerId === playerId)?.contentIds ?? []
}

export function toggleUnlockedContent(
  unlocks: PlayerUnlockedContent[],
  playerId: string,
  contentId: string
): PlayerUnlockedContent[] {
  const existing = unlocks.find((entry) => entry.playerId === playerId)

  if (!existing) {
    return [...unlocks, { playerId, contentIds: [contentId] }]
  }

  const alreadyUnlocked = existing.contentIds.includes(contentId)

  return unlocks.map((entry) => {
    if (entry.playerId !== playerId) return entry

    return {
      ...entry,
      contentIds: alreadyUnlocked
        ? entry.contentIds.filter((id) => id !== contentId)
        : [...entry.contentIds, contentId],
    }
  })
}