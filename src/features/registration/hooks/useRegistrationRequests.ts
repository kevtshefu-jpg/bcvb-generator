import { useEffect, useState } from 'react'
import { fetchRegistrationRequests, type RegistrationRequestRow } from '../services/registrationService'
import {
  approveRegistrationAndCreateUser,
  rejectRegistrationRequest,
} from '../services/registrationApprovalService'
import { formatUserFacingError } from '../../../lib/userFacingError'

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
          setError(formatUserFacingError(err, 'Les demandes d’inscription ne peuvent pas être chargées pour le moment. Réessaie dans quelques instants.'))
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
      setError(formatUserFacingError(err, 'La demande n’a pas pu être approuvée. Vérifie le profil puis relance l’action.'))
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
      setError(formatUserFacingError(err, 'La demande n’a pas pu être refusée. Réessaie ou recharge la liste.'))
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
