import { useCallback, useEffect, useRef, useState } from 'react'
import {
  downloadMarkdownDocument,
  downloadSourceDocument as downloadSourceDocumentService,
  generateDocumentPdf,
  type ExportableDocument,
} from '../services/documentExportService'

export type ExportActionType = 'pdf' | 'source' | 'markdown'

function getLoadingMessage(type: ExportActionType) {
  if (type === 'pdf') return 'Préparation PDF...'
  if (type === 'source') return 'Téléchargement...'
  return 'Préparation Markdown...'
}

export function useDocumentExportActions() {
  const [exportLoadingId, setExportLoadingId] = useState<string | null>(null)
  const [exportLoadingType, setExportLoadingType] = useState<ExportActionType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const runningDocumentIdsRef = useRef<Set<string>>(new Set())

  const clearExportFeedback = useCallback(() => {
    setError(null)
    setSuccess(null)

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const scheduleFeedbackClear = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = window.setTimeout(() => {
      setError(null)
      setSuccess(null)
      timeoutRef.current = null
    }, 4500)
  }, [])

  const runExportAction = useCallback(
    async (
      document: ExportableDocument,
      type: ExportActionType,
      action: () => Promise<{ ok: boolean; filename?: string; error?: string }>,
    ) => {
      if (runningDocumentIdsRef.current.has(document.id)) return

      runningDocumentIdsRef.current.add(document.id)
      clearExportFeedback()
      setExportLoadingId(document.id)
      setExportLoadingType(type)

      try {
        const result = await action()

        if (!result.ok) {
          setError(result.error || 'Action impossible pour ce document.')
          scheduleFeedbackClear()
          return
        }

        const filename = result.filename ? ` (${result.filename})` : ''
        setSuccess(`${getLoadingMessage(type).replace('...', '')} terminé${filename}.`)
        scheduleFeedbackClear()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Action impossible pour ce document.')
        scheduleFeedbackClear()
      } finally {
        runningDocumentIdsRef.current.delete(document.id)
        setExportLoadingId(null)
        setExportLoadingType(null)
      }
    },
    [clearExportFeedback, scheduleFeedbackClear],
  )

  const generatePdf = useCallback(
    (document: ExportableDocument) =>
      runExportAction(document, 'pdf', () => generateDocumentPdf(document)),
    [runExportAction],
  )

  const downloadSource = useCallback(
    (document: ExportableDocument) =>
      runExportAction(document, 'source', () => downloadSourceDocumentService(document)),
    [runExportAction],
  )

  const downloadMarkdown = useCallback(
    (document: ExportableDocument) =>
      runExportAction(document, 'markdown', async () => downloadMarkdownDocument(document)),
    [runExportAction],
  )

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    },
    [],
  )

  return {
    exportLoadingId,
    exportLoadingType,
    exportLoadingMessage: exportLoadingType ? getLoadingMessage(exportLoadingType) : null,
    error,
    success,
    generatePdf,
    downloadSource,
    downloadMarkdown,
    clearExportFeedback,
  }
}
