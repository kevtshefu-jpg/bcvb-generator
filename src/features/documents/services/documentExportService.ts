import { supabase } from '../../../lib/supabase'

export type ExportFormat = 'pdf' | 'markdown' | 'txt' | 'html'

export type ExportableDocument = {
  id: string
  title: string
  content?: string | null
  source_markdown?: string | null
  sourceMarkdown?: string | null
  html?: string | null
  rendered_html?: string | null
  file_url?: string | null
  source_url?: string | null
  sourceDownloadUrl?: string | null
  source_download_url?: string | null
  pdf_url?: string | null
  bucket_name?: string | null
  storage_path?: string | null
  downloadUrl?: string | null
  download_url?: string | null
  updated_at?: string | null
}

export type ExportResult = {
  ok: boolean
  format: ExportFormat
  filename?: string
  error?: string
}

function stripHtml(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function triggerDownload(url: string, filename?: string) {
  const link = document.createElement('a')
  link.href = url
  if (filename) link.download = filename
  link.rel = 'noopener noreferrer'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

function isDownloadableUrl(value?: string | null) {
  return Boolean(value && (/^https?:\/\//i.test(value) || value.startsWith('/')))
}

export function getDocumentExportSource(document: ExportableDocument): string | null {
  const markdown =
    document.source_markdown?.trim() ||
    document.sourceMarkdown?.trim() ||
    document.content?.trim()

  if (markdown) return markdown

  const html = document.rendered_html?.trim() || document.html?.trim()
  if (html) return stripHtml(html)

  return null
}

export function canExportDocument(document: ExportableDocument, format: ExportFormat): boolean {
  if (format === 'markdown' || format === 'txt') {
    return Boolean(getDocumentExportSource(document))
  }

  if (format === 'html') {
    return Boolean(document.html?.trim() || document.rendered_html?.trim() || getDocumentExportSource(document))
  }

  if (format === 'pdf') {
    return Boolean(document.pdf_url || document.file_url || getDocumentExportSource(document))
  }

  return false
}

export function buildSafeFilename(title: string, extension: string) {
  const safeTitle =
    title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\\/:*?"<>|#%{}[\]~^`]+/g, '-')
      .replace(/[^a-zA-Z0-9._ -]+/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'document-bcvb'

  const safeExtension = extension.replace(/^\./, '').toLowerCase()
  return `${safeTitle}.${safeExtension}`
}

export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  try {
    triggerDownload(url, filename)
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}

export function downloadMarkdownDocument(document: ExportableDocument): ExportResult {
  const source = getDocumentExportSource(document)

  if (!source) {
    return {
      ok: false,
      format: 'markdown',
      error: 'Source Markdown indisponible pour ce document.',
    }
  }

  const filename = buildSafeFilename(document.title || document.id || 'document-bcvb', 'md')
  downloadTextFile(filename, source, 'text/markdown;charset=utf-8')

  return {
    ok: true,
    format: 'markdown',
    filename,
  }
}

export async function downloadSourceDocument(document: ExportableDocument): Promise<ExportResult> {
  let directUrl =
    document.source_url ||
    document.sourceDownloadUrl ||
    document.source_download_url ||
    document.downloadUrl ||
    document.download_url ||
    document.file_url

  if (!directUrl && document.bucket_name && document.storage_path) {
    const { data, error } = await supabase.storage
      .from(document.bucket_name)
      .createSignedUrl(document.storage_path, 60)

    if (error) {
      return {
        ok: false,
        format: 'markdown',
        error: `Téléchargement impossible : ${error.message}`,
      }
    }

    directUrl = data.signedUrl
  }

  if (isDownloadableUrl(directUrl) && directUrl) {
    triggerDownload(directUrl)
    return {
      ok: true,
      format: 'markdown',
      filename: buildSafeFilename(document.title || document.id || 'document-bcvb', 'md'),
    }
  }

  return downloadMarkdownDocument(document)
}

export async function generateDocumentPdf(document: ExportableDocument): Promise<ExportResult> {
  const source = getDocumentExportSource(document)

  if (!source) {
    return {
      ok: false,
      format: 'pdf',
      error: 'Impossible de générer le PDF : aucune source exploitable.',
    }
  }

  try {
    const { jsPDF } = await import('jspdf')
    const filename = buildSafeFilename(document.title || document.id || 'document-bcvb', 'pdf')
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 48
    const lineHeight = 14
    const maxWidth = pageWidth - margin * 2
    const title = document.title || 'Document BCVB'

    pdf.setProperties({
      title,
      subject: 'BCVB Référentiel',
      creator: 'BCVB Référentiel',
    })

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(16)
    pdf.text(title, margin, margin)

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)

    let y = margin + 30
    const lines = pdf.splitTextToSize(source, maxWidth) as string[]

    lines.forEach((line) => {
      if (y > pageHeight - margin) {
        pdf.addPage()
        y = margin
      }

      pdf.text(line, margin, y)
      y += line.trim() ? lineHeight : lineHeight * 0.75
    })

    pdf.save(filename)

    return {
      ok: true,
      format: 'pdf',
      filename,
    }
  } catch (error) {
    return {
      ok: false,
      format: 'pdf',
      error:
        error instanceof Error
          ? `Export PDF impossible : ${error.message}`
          : 'Export PDF impossible pour une raison inconnue.',
    }
  }
}
