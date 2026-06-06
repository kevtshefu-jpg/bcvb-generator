import { createWorker } from 'tesseract.js'

export async function extractTextWithOCR(image: File | HTMLCanvasElement): Promise<string> {
  const worker = await createWorker('fra+eng')

  try {
    const { data } = await worker.recognize(image)
    return data.text.trim()
  } finally {
    await worker.terminate()
  }
}

