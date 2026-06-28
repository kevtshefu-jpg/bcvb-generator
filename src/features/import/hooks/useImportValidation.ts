import { useEffect, useState } from 'react'
import {
  createProfileFromImportRow,
  fetchImportRows,
  markImportRowAsImported,
  updateImportRowValidation,
  type ImportRowDb,
} from '../services/importValidationService'
import { formatUserFacingError } from '../../../lib/userFacingError'

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
    const currentBatchId = batchId

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchImportRows(currentBatchId)
        if (active) setRows(data)
      } catch (err) {
        if (active) {
          setError(formatUserFacingError(err, 'Les lignes du lot ne peuvent pas être chargées pour le moment. Réessaie après avoir sélectionné le lot.'))
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
      setError(formatUserFacingError(err, 'Cette ligne n’a pas pu être validée. Vérifie les informations puis relance la validation.'))
    }
  }

  async function unvalidateRow(rowId: string, note?: string) {
    try {
      setError(null)
      const updated = await updateImportRowValidation(rowId, false, note)
      setRows((current) => current.map((row) => (row.id === rowId ? updated : row)))
    } catch (err) {
      setError(formatUserFacingError(err, 'Cette ligne n’a pas pu être remise à contrôler. Recharge le lot puis réessaie.'))
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
      setError(formatUserFacingError(err, 'Le profil n’a pas pu être créé depuis cette ligne. Vérifie que la ligne est complète et validée.'))
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
