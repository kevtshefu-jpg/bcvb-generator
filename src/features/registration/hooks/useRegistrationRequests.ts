import { useEffect, useState } from 'react'
import { fetchRegistrationRequests, type RegistrationRequestRow } from '../services/registrationService'
import {
  approveRegistrationAndCreateUser,
  rejectRegistrationRequest,
} from '../services/registrationApprovalService'

type RegistrationRequestActionInput = {
  id: string
  role_requested?: string | null
  requested_role?: string | null
}

export function useRegistrationRequests(approvedBy?: string) {
  const [requests, setRequests] = useState<RegistrationRequestRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastApprovalMessage, setLastApprovalMessage] = useState<string | null>(null)

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

  async function approve(item: RegistrationRequestActionInput) {
    try {
      setError(null)
      setLastApprovalMessage(null)

      const result = await approveRegistrationAndCreateUser(
        item.id,
        item.role_requested || item.requested_role || undefined,
      )

      setLastApprovalMessage(
        result.message ||
          (result.email_sent
            ? 'Compte créé et email d’activation envoyé.'
            : 'Compte créé, mais l’email d’activation doit être renvoyé.'),
      )

      const rows = await fetchRegistrationRequests()
      setRequests(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur approbation')
    }
  }

  async function reject(item: RegistrationRequestActionInput) {
    try {
      setError(null)
      setLastApprovalMessage(null)
      await rejectRegistrationRequest(item.id, approvedBy)
      const rows = await fetchRegistrationRequests()
      setRequests(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur refus')
    }
  }

  return {
    requests,
    loading,
    error,
    approve,
    reject,
    lastApprovalMessage,
  }
}
