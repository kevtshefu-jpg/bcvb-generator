import { supabase } from './supabase'

export type DownloadableDocument = {
  id?: string
  title?: string
  file_url?: string | null
  bucket_name?: string | null
  storage_path?: string | null
  content?: string | null
  source_markdown?: string | null
  html?: string | null
  rendered_html?: string | null
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'document-bcvb'
}

function triggerDownload(url: string, filename?: string) {
  const link = document.createElement('a')
  link.href = url
  if (filename) link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
}

function downloadBlob(content: BlobPart, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  triggerDownload(url, filename)
  URL.revokeObjectURL(url)
}

function getDocumentSource(document: DownloadableDocument) {
  return document.content?.trim() || document.source_markdown?.trim() || ''
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function buildPrintableHtml(document: DownloadableDocument, source: string) {
  const title = escapeHtml(document.title || 'Document BCVB')
  const safeSource = escapeHtml(source)
    .split('\n')
    .map((line) => {
      if (line.startsWith('# ')) return `<h1>${line.replace(/^#\s+/, '')}</h1>`
      if (line.startsWith('## ')) return `<h2>${line.replace(/^##\s+/, '')}</h2>`
      if (line.startsWith('### ')) return `<h3>${line.replace(/^###\s+/, '')}</h3>`
      if (line.trim().startsWith('- ')) return `<p class="bullet">${line.trim()}</p>`
      return line.trim() ? `<p>${line}</p>` : '<br />'
    })
    .join('')

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      body { margin: 0; background: #f4f5f7; color: #14181f; font-family: Inter, Arial, sans-serif; }
      .document-paper { width: 794px; min-height: 1123px; margin: 0 auto; padding: 56px; box-sizing: border-box; background: #fff; }
      .eyebrow { margin: 0 0 12px; color: #a32035; font-size: 12px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
      h1 { margin: 0 0 22px; font-size: 34px; line-height: 1.05; text-transform: uppercase; }
      h2 { margin: 28px 0 12px; font-size: 22px; color: #a32035; }
      h3 { margin: 20px 0 10px; font-size: 17px; }
      p { margin: 0 0 10px; line-height: 1.55; }
      .bullet { padding-left: 18px; }
      .bullet::before { content: "•"; margin-left: -16px; margin-right: 8px; color: #a32035; font-weight: 900; }
    </style>
  </head>
  <body>
    <main class="document-paper">
      <p class="eyebrow">BCVB Référentiel</p>
      <h1>${title}</h1>
      ${safeSource}
    </main>
  </body>
</html>`
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
  const title = slugify(document.title || document.id || 'document-bcvb')
  const url = await ensureDownloadUrl(document)

  if (url) {
    triggerDownload(url)
    return
  }

  const source = getDocumentSource(document)
  if (source) {
    downloadBlob(source, `${title}.md`, 'text/markdown;charset=utf-8')
    return
  }

  throw new Error('Aucune source téléchargeable pour ce document.')
}

export async function downloadMarkdownDocument(document: DownloadableDocument) {
  const source = getDocumentSource(document)

  if (!source) {
    throw new Error('Ce document ne contient pas de source Markdown exploitable.')
  }

  downloadBlob(
    source,
    `${slugify(document.title || document.id || 'document-bcvb')}.md`,
    'text/markdown;charset=utf-8'
  )
}

export async function downloadPdfDocument(document: DownloadableDocument) {
  const title = slugify(document.title || document.id || 'document-bcvb')
  const source = getDocumentSource(document)
  const html = document.rendered_html || document.html || (source ? buildPrintableHtml(document, source) : '')

  if (!html) {
    throw new Error(
      'Impossible de générer un PDF : aucun contenu, source Markdown ou rendu HTML exploitable.',
    )
  }

  try {
    const { exportLibraryDocumentHtmlToPdf } = await import(
      '../features/library/utils/exportLibraryDocumentPdf'
    )
    await exportLibraryDocumentHtmlToPdf(html, `${title}.pdf`)
  } catch (error) {
    console.warn('Export PDF indisponible, fallback source/HTML :', error)

    if (source) {
      downloadBlob(source, `${title}-source-secours.md`, 'text/markdown;charset=utf-8')
      throw new Error(
        'Export PDF interrompu. La source Markdown a été téléchargée en secours ; relance l’export après vérification du rendu.',
      )
    }

    downloadBlob(html, `${title}-apercu-secours.html`, 'text/html;charset=utf-8')
    throw new Error(
      'Export PDF interrompu. Un aperçu HTML a été téléchargé en secours.',
    )
  }
}
