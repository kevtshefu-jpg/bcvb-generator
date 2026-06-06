import * as pdfjsLib from 'pdfjs-dist'
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'
import mammoth from 'mammoth'
import { extractTextWithOCR } from './ocr/extractTextWithOCR'
import { renderPdfPagesToImages } from './ocr/renderPdfPagesToImages'
import { normalizeOcrText } from './ocr/normalizeOcrText'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

export type ExtractedAttachmentText = {
  fileName: string
  fileType: string
  text: string
  rawText?: string
  ocrPageCount?: number
  warning?: string
}

function getExtension(file: File) {
  return file.name.split('.').pop()?.toLowerCase() ?? ''
}

function isImage(file: File) {
  return file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(getExtension(file))
}

async function extractPdfText(file: File) {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const pages: string[] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .map((item) => ('str' in item ? String(item.str) : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (pageText) pages.push(pageText)
  }

  return pages.join('\n\n')
}

async function extractPdfWithOCR(file: File) {
  const rendered = await renderPdfPagesToImages(file, 10)
  const pages: string[] = []

  for (const [index, canvas] of rendered.canvases.entries()) {
    const pageText = await extractTextWithOCR(canvas)
    if (pageText.trim()) pages.push(`--- Page ${index + 1} ---\n${pageText.trim()}`)
  }

  return {
    text: pages.join('\n\n'),
    pageCount: rendered.renderedPages,
    warning: rendered.warning,
  }
}

async function extractDocxText(file: File) {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value.trim()
}

export async function extractTextFromAttachment(file: File): Promise<ExtractedAttachmentText> {
  const extension = getExtension(file)
  const fileType = file.type || extension || 'unknown'

  if (isImage(file)) {
    const rawText = await extractTextWithOCR(file)
    const text = normalizeOcrText(rawText)
    return {
      fileName: file.name,
      fileType,
      text,
      rawText,
      warning: 'Texte extrait par OCR : le résultat peut être imparfait et doit être relu.',
    }
  }

  if (extension === 'txt' || extension === 'md' || file.type.startsWith('text/')) {
    return {
      fileName: file.name,
      fileType,
      text: await file.text(),
    }
  }

  if (extension === 'pdf' || file.type === 'application/pdf') {
    const text = await extractPdfText(file)
    const usefulText = text.replace(/\s+/g, '')
    if (usefulText.length < 100) {
      const ocr = await extractPdfWithOCR(file)
      const cleaned = normalizeOcrText(ocr.text)
      return {
        fileName: file.name,
        fileType,
        text: cleaned,
        rawText: ocr.text,
        ocrPageCount: ocr.pageCount,
        warning:
          ocr.warning ??
          'PDF probablement scanné : texte extrait par OCR, résultat à relire.',
      }
    }

    return {
      fileName: file.name,
      fileType,
      text,
      rawText: text,
      warning: text.trim()
        ? undefined
        : 'Aucun texte exploitable détecté. Extraction OCR non encore disponible dans cette version.',
    }
  }

  if (
    extension === 'docx' ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return {
      fileName: file.name,
      fileType,
      text: await extractDocxText(file),
    }
  }

  throw new Error('Format non supporté. Formats acceptés : .txt, .md, .pdf, .docx, .png, .jpg.')
}
