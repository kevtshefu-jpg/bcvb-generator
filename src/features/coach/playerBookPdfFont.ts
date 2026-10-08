import type { jsPDF } from 'jspdf'
import normal from './pdfFonts/normal'
import bold from './pdfFonts/bold'
import coverage from './pdfFonts/coverage.json'

const supported = new Set(coverage)
export function normalizePlayerBookPdfText(text: string): string {
  const value = text.normalize('NFC').replace(/\r\n?/g, '\n').replace(/\t/g, '    ')
  for (const character of value) {
    if (character !== '\n' && !supported.has(character.codePointAt(0)!)) {
      throw new Error('PLAYER_BOOK_PDF_UNSUPPORTED_CHARACTER')
    }
  }
  return value
}

export function registerPlayerBookPdfFonts(pdf: jsPDF): void {
  pdf.addFileToVFS('BCVB-DejaVuSans.ttf', normal)
  pdf.addFont('BCVB-DejaVuSans.ttf', 'BCVB', 'normal')
  pdf.addFileToVFS('BCVB-DejaVuSans-Bold.ttf', bold)
  pdf.addFont('BCVB-DejaVuSans-Bold.ttf', 'BCVB', 'bold')
}
