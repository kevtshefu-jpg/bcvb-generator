import { useEffect, useState } from 'react'
import {
  createProfileFromImportRow,
  fetchImportRows,
  markImportRowAsImported,
  updateImportRowValidation,
  type ImportRowDb,
} from '../services/importValidationService'

export function useImportValidation(batchId?: string) {
  const [rows, setRows] = useState<ImportRowDb[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!batchId) {
      setRows([])
      return
    }

    let active = true

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchImportRows(batchId)
        if (active) setRows(data)
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Erreur chargement batch')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [batchId])

  async function validateRow(rowId: string, note?: string) {
    try {
      setError(null)
      const updated = await updateImportRowValidation(rowId, true, note)
      setRows((current) => current.map((row) => (row.id === rowId ? updated : row)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur validation ligne')
    }
  }

  async function unvalidateRow(rowId: string, note?: string) {
    try {
      setError(null)
      const updated = await updateImportRowValidation(rowId, false, note)
      setRows((current) => current.map((row) => (row.id === rowId ? updated : row)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur dévalidation ligne')
    }
  }

  async function importValidatedRow(rowId: string) {
    try {
      setError(null)
      const row = rows.find((item) => item.id === rowId)
      if (!row) return
      if (!row.validated) throw new Error('La ligne doit être validée avant import.')

      const profile = await createProfileFromImportRow(row)
      const updated = await markImportRowAsImported(rowId, profile.id)

      setRows((current) => current.map((item) => (item.id === rowId ? updated : item)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur import profil')
    }
  }

  return {
    rows,
    loading,
    error,
    validateRow,
    unvalidateRow,
    importValidatedRow,
  }
}