import { useEffect, useState } from 'react'
import {
  fetchRegistrationRequests,
  updateRegistrationRequestStatus,
  type RegistrationRequestRow,
} from '../services/registrationService'

export function useRegistrationRequests(approvedBy?: string) {
  const [requests, setRequests] = useState<RegistrationRequestRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const rows = await fetchRegistrationRequests()
        if (active) setRequests(rows)
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Erreur chargement inscriptions')
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

  async function setStatus(id: string, status: 'approved' | 'rejected') {
    try {
      setError(null)
      const updated = await updateRegistrationRequestStatus(id, status, approvedBy)

      setRequests((current) =>
        current.map((item) => (item.id === id ? updated : item))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur mise à jour demande')
    }
  }

  return {
    requests,
    loading,
    error,
    setStatus,
  }
}