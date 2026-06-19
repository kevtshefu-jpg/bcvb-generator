import { supabase } from './supabase'
import {
  downloadMarkdownDocument as downloadMarkdownDocumentFromService,
  downloadSourceDocument as downloadSourceDocumentFromService,
  generateDocumentPdf,
  type ExportableDocument,
} from '../features/documents/services/documentExportService'

export type DownloadableDocument = ExportableDocument & {
  bucket_name?: string | null
  storage_path?: string | null
}

export async function ensureDownloadUrl(document: DownloadableDocument) {
  if (document.file_url) return document.file_url

  if (document.bucket_name && document.storage_path) {
    const { data, error } = await supabase.storage
      .from(document.bucket_name)
      .createSignedUrl(document.storage_path, 60)

    if (error) throw error
    return data.signedUrl
  }

  return null
}

export async function downloadSourceDocument(document: DownloadableDocument) {
  const result = await downloadSourceDocumentFromService(document)

  if (!result.ok) {
    throw new Error(result.error || 'Aucune source téléchargeable pour ce document.')
  }
}

export async function downloadMarkdownDocument(document: DownloadableDocument) {
  const result = downloadMarkdownDocumentFromService(document)

  if (!result.ok) {
    throw new Error(result.error || 'Ce document ne contient pas de source Markdown exploitable.')
  }
}

export async function downloadPdfDocument(document: DownloadableDocument) {
  const result = await generateDocumentPdf(document)

  if (!result.ok) {
    throw new Error(result.error || 'Impossible de générer le PDF.')
  }
}
