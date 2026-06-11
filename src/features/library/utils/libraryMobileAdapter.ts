import type { LibraryDocumentRow } from '../services/libraryService'
import type { LibraryMobileDocument } from '../components/LibraryMobileExperience'

function readStringValue(source: unknown, keys: string[]) {
  if (!source || typeof source !== 'object') return undefined

  const record = source as Record<string, unknown>

  for (const key of keys) {
    const value = record[key]

    if (typeof value === 'string' && value.trim()) {
      return value
    }

    if (typeof value === 'number') {
      return String(value)
    }
  }

  return undefined
}

function readBooleanValue(source: unknown, keys: string[], fallback = false) {
  if (!source || typeof source !== 'object') return fallback

  const record = source as Record<string, unknown>

  for (const key of keys) {
    const value = record[key]

    if (typeof value === 'boolean') {
      return value
    }
  }

  return fallback
}

export function mapLibraryDocumentToMobileDocument(
  document: LibraryDocumentRow,
): LibraryMobileDocument {
  const id = readStringValue(document, ['id', 'document_id', 'uuid']) || crypto.randomUUID()

  const title =
    readStringValue(document, ['title', 'name', 'filename', 'file_name']) ||
    'Document BCVB'

  const description = readStringValue(document, [
    'description',
    'summary',
    'excerpt',
    'content_summary',
  ])

  const family = readStringValue(document, [
    'family',
    'document_family',
    'documentFamily',
    'document_families',
  ])

  const mainCategory = readStringValue(document, [
    'main_category',
    'mainCategory',
    'category',
    'document_category',
    'documentCategory',
  ])

  const subCategory = readStringValue(document, [
    'sub_category',
    'subCategory',
    'subcategory',
    'document_sub_category',
    'documentSubCategory',
  ])

  const theme = readStringValue(document, [
    'theme',
    'document_theme',
    'documentTheme',
  ])

  const audience = readStringValue(document, [
    'audience',
    'target_audience',
    'targetAudience',
    'sport_category',
    'sportCategory',
  ])

  const type =
    readStringValue(document, [
      'type',
      'document_type',
      'documentType',
      'file_type',
      'fileType',
      'mime_type',
      'mimeType',
      'extension',
      'file_extension',
    ]) || 'Document'

  const status = readStringValue(document, [
    'status',
    'publication_status',
    'publicationStatus',
    'state',
  ])

  const publicationLevel = readStringValue(document, [
    'publication_level',
    'publicationLevel',
    'level',
  ])

  const updatedAt = readStringValue(document, [
    'updated_at',
    'updatedAt',
    'last_modified_at',
    'lastModifiedAt',
    'created_at',
    'createdAt',
  ])

  const createdAt = readStringValue(document, [
    'created_at',
    'createdAt',
  ])

  const isArchived = readBooleanValue(document, ['archived', 'is_archived'], false)
  const isDeleted = readBooleanValue(document, ['deleted', 'is_deleted', 'soft_deleted'], false)

  return {
    id,
    title,
    description,
    family,
    mainCategory,
    subCategory,
    theme,
    audience,
    type,
    status,
    publicationLevel,
    updatedAt,
    createdAt,
    locked: isArchived || isDeleted,
    canPreview: true,
    canDownload: true,
    canTransform: true,
  }
}