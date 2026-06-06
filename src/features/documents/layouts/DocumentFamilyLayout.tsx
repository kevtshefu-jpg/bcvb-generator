import type { ReactNode } from 'react'
import type { LibraryDocumentRow } from '../../library/services/libraryService'
import {
  getDocumentStandard,
  resolveDocumentFamilyId,
  type DocumentFamilyId,
} from '../standards/documentFamilyStandards'

type DocumentFamilyLayoutProps = {
  document?: Partial<LibraryDocumentRow>
  family?: DocumentFamilyId
  children: ReactNode
}

export function DocumentFamilyLayout({
  document,
  family,
  children,
}: DocumentFamilyLayoutProps) {
  const resolvedFamily =
    family ??
    resolveDocumentFamilyId(
      [
        document?.document_type,
        document?.title,
        document?.category_code,
        document?.theme_code,
      ]
        .filter(Boolean)
        .join(' ')
    )
  const standard = getDocumentStandard(resolvedFamily)

  return (
    <div
      className={`document-family-layout ${standard.cssClass}`}
      data-document-family={standard.id}
    >
      {children}
    </div>
  )
}
