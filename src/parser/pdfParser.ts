import * as pdfjsLib from 'pdfjs-dist'
import type { PdfParseResult } from '../types/session'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString()

export async function extractTextFromPdf(file: File): Promise<PdfParseResult> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items.map(item => {
      // @ts-ignore
      return item.str || ''
    }).join(' ')
    fullText += '\n' + pageText
  }

  return {
    text: fullText.trim(),
    pageCount: pdf.numPages
  }
}
