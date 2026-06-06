import {
  getDocumentStandard,
  resolveDocumentFamilyId,
  type DocumentFamilyId,
} from '../standards/documentFamilyStandards'

export type PdfExportFamilyOptions = {
  format: 'a4'
  orientation: 'portrait' | 'landscape'
  onePagePreferred?: boolean
}

export function getPdfExportOptions(familyOrType?: DocumentFamilyId | string | null): PdfExportFamilyOptions {
  const family =
    familyOrType && ['technical-book', 'coach-guide', 'training-plan', 'pedagogical-ribbon', 'practice-session', 'theme-sheet'].includes(familyOrType)
      ? (familyOrType as DocumentFamilyId)
      : resolveDocumentFamilyId(familyOrType)
  const standard = getDocumentStandard(family)

  return {
    format: 'a4',
    orientation: standard.pdfOrientation,
    onePagePreferred: family === 'practice-session',
  }
}
