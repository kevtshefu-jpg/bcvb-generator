export type DocumentModel = {
  id: string
  title: string
  description: string
  summary: string
  content: string
  family: string
  category: string
  subCategory: string
  theme: string
  sportCategory: string
  audience: string[]
  season: string
  status: string
  publicationLevel: string
  qualityScore: number
  tags: string[]
  sourcePath: string
  pdfPath: string
  downloadUrl: string
  sourceDownloadUrl: string
  visibility: string
  allowedRoles: string[]
  ownerId: string
  teamId: string | null
  sourceDocumentId: string | null
  parentDocumentId: string | null
  createdFromDocumentId: string | null
  version: number
  isLatestVersion: boolean
  isArchived: boolean
  archivedAt: string | null
  archivedBy: string | null
  isDeleted: boolean
  deletedAt: string | null
  deletedBy: string | null
  deleteReason: string
  createdAt: string
  updatedAt: string
}

export const documentModel: DocumentModel
export const DOCUMENT_FAMILIES: string[]
export const DOCUMENT_MAIN_CATEGORIES: string[]
export const DOCUMENT_SUB_CATEGORIES: string[]
export const DOCUMENT_THEMES: string[]
export const SPORT_CATEGORIES: string[]
export const PUBLICATION_LEVELS: string[]
