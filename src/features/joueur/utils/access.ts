import type { PlayerContentItem } from '../data/playerContents'

export function canPlayerSeeContent(
  playerCategory: string,
  unlockedContentIds: string[],
  content: PlayerContentItem
) {
  const categoryAccess = content.categoryIds.includes(playerCategory)
  const manualAccess = unlockedContentIds.includes(content.id)

  if (content.unlockedByCoachOnly) {
    return manualAccess
  }

  return categoryAccess || manualAccess
}