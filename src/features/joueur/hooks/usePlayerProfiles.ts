import { useEffect, useState } from 'react'
import { fetchPlayerProfiles } from '../../auth/services/profilesService'
import type { ProfileRow } from '../../auth/types/profile'

export function usePlayerProfiles() {
  const [players, setPlayers] = useState<ProfileRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const rows = await fetchPlayerProfiles()
        if (active) setPlayers(rows)
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Erreur chargement joueurs')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  return {
    players,
    loading,
    error,
  }
}