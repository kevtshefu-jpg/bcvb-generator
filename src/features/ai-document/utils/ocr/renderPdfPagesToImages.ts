import * as pdfjsLib from 'pdfjs-dist'
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

export type RenderedPdfPages = {
  canvases: HTMLCanvasElement[]
  pageCount: number
  renderedPages: number
  warning?: string
}

export async function renderPdfPagesToImages(
  file: File,
  maxPages = 10
): Promise<RenderedPdfPages> {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const renderedPages = Math.min(pdf.numPages, maxPages)
  const canvases: HTMLCanvasElement[] = []

  for (let pageNum = 1; pageNum <= renderedPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale: 1.8 })
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context) continue

    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvasContext: context, viewport }).promise
    canvases.push(canvas)
  }

  return {
    canvases,
    pageCount: pdf.numPages,
    renderedPages,
    warning:
      pdf.numPages > renderedPages
        ? `OCR limité aux ${renderedPages} premières pages sur ${pdf.numPages} pour éviter de bloquer le navigateur.`
        : undefined,
  }
}

