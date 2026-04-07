import * as pdfjsLib from 'pdfjs-dist'
import { normalizeRow, type NormalizedImportRow } from './normalizeImportRows'

// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

function extractCandidateRowsFromText(text: string) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const rows: Record<string, unknown>[] = []

  for (const line of lines) {
    // Exemple simple : "NOM Prenom 2012 U13 email@email.com 0612345678"
    const emailMatch = line.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
    const phoneMatch = line.match(/(\+33|0)[0-9\s.]{9,}/)
    const yearMatch = line.match(/\b(19|20)\d{2}\b/)
    const categoryMatch = line.match(/\bU7\b|\bU9\b|\bU11\b|\bU13\b|\bU15\b|\bU18\b|\bSENIORS?\b/i)

    const parts = line.split(/\s+/)

    if (parts.length >= 2) {
      rows.push({
        nom: parts[0] ?? '',
        prenom: parts[1] ?? '',
        email: emailMatch?.[0] ?? '',
        telephone: phoneMatch?.[0] ?? '',
        annee_naissance: yearMatch?.[0] ?? '',
        categorie: categoryMatch?.[0] ?? '',
        ligne_source: line,
      })
    }
  }

  return rows
}

export async function parsePdfFile(file: File): Promise<NormalizedImportRow[]> {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise

  let fullText = ''

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ')
    fullText += `${pageText}\n`
  }

  const extracted = extractCandidateRowsFromText(fullText)
  return extracted.map(normalizeRow)
}