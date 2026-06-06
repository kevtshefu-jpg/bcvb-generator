import { supabase } from './supabase'

export type DownloadableDocument = {
  id?: string
  title?: string
  file_url?: string | null
  bucket_name?: string | null
  storage_path?: string | null
  content?: string | null
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

  if (document.content?.trim()) {
    downloadBlob(document.content, `${title}.md`, 'text/markdown;charset=utf-8')
    return
  }

  throw new Error('Aucune source téléchargeable pour ce document.')
}

export async function downloadMarkdownDocument(document: DownloadableDocument) {
  if (!document.content?.trim()) {
    throw new Error('Ce document ne contient pas de source Markdown exploitable.')
  }

  downloadBlob(
    document.content,
    `${slugify(document.title || document.id || 'document-bcvb')}.md`,
    'text/markdown;charset=utf-8'
  )
}

export async function downloadPdfDocument(document: DownloadableDocument) {
  const html = document.rendered_html || document.html
  if (html) {
    downloadBlob(
      html,
      `${slugify(document.title || document.id || 'document-bcvb')}.html`,
      'text/html;charset=utf-8'
    )
    return
  }

  if (document.content?.trim()) {
    const printable = `<html><head><meta charset="utf-8"><title>${document.title || 'Document BCVB'}</title></head><body><pre>${document.content}</pre></body></html>`
    downloadBlob(printable, `${slugify(document.title || document.id || 'document-bcvb')}.html`, 'text/html;charset=utf-8')
    return
  }

  throw new Error('Impossible de générer un PDF : aucun contenu exploitable.')
}
