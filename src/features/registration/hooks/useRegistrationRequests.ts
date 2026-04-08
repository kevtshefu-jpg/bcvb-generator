import { useEffect, useState } from 'react'
import { fetchRegistrationRequests, type RegistrationRequestRow } from '../services/registrationService'
import {
  approveRegistrationAndCreateUser,
  rejectRegistrationRequest,
} from '../services/registrationApprovalService'

export function useRegistrationRequests(approvedBy?: string) {
  const [requests, setRequests] = useState<RegistrationRequestRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastCreatedPassword, setLastCreatedPassword] = useState<string | null>(null)

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

  async function approve(item: RegistrationRequestRow) {
    try {
      setError(null)
      setLastCreatedPassword(null)

      const result = await approveRegistrationAndCreateUser({
        request_id: item.id,
        email: item.email,
        first_name: item.first_name,
        last_name: item.last_name,
        category_requested: item.category_requested,
        role_requested: item.role_requested,
        approved_by: approvedBy,
      })

      setLastCreatedPassword(result.temporary_password)

      const rows = await fetchRegistrationRequests()
      setRequests(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur approbation')
    }
  }

  async function reject(item: RegistrationRequestRow) {
    try {
      setError(null)
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
    lastCreatedPassword,
  }
}