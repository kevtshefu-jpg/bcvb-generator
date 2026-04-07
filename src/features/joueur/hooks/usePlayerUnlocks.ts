import { useEffect, useState } from 'react'
import {
  fetchUnlockedContentIds,
  lockContentForPlayer,
  unlockContentForPlayer,
} from '../services/unlocksService'

export function usePlayerUnlocks(playerId?: string, unlockedBy?: string) {
  const [unlockedIds, setUnlockedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!playerId) {
      setUnlockedIds([])
      return
    }

    let active = true
    const currentPlayerId = playerId

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const ids = await fetchUnlockedContentIds(currentPlayerId)
        if (active) setUnlockedIds(ids)
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Erreur de chargement')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [playerId])

  async function toggle(contentId: string) {
    if (!playerId) return

    const currentPlayerId = playerId
    const isUnlocked = unlockedIds.includes(contentId)

    try {
      setError(null)

      if (isUnlocked) {
        await lockContentForPlayer(currentPlayerId, contentId)
        setUnlockedIds((current) => current.filter((id) => id !== contentId))
      } else {
        await unlockContentForPlayer(currentPlayerId, contentId, unlockedBy)
        setUnlockedIds((current) => [...current, contentId])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
    }
  }

  return {
    unlockedIds,
    loading,
    error,
    toggle,
  }
}