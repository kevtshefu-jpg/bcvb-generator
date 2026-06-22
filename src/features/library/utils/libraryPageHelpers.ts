import type { LibraryMobileDocument } from '../components/LibraryMobileExperience'
import type { LibraryDocumentRow } from '../services/libraryService'

export type LibraryViewMode = 'grid' | 'list'

export type LibraryFilters = {
  search: string
  family: string
  category: string
  subCategory: string
  theme: string
  sportCategory: string
  audience: string
  season: string
  status: string
  fileType: string
  publicationLevel: string
  tag: string
  lifecycle: string
  viewMode: LibraryViewMode
}

export const FILTER_STORAGE_KEY = 'bcvb-library-filters'
export const SCROLL_STORAGE_KEY = 'bcvb-library-scroll-y'

export const defaultFilters: LibraryFilters = {
  search: '',
  family: 'all',
  category: 'all',
  subCategory: 'all',
  theme: 'all',
  sportCategory: 'all',
  audience: 'all',
  season: 'all',
  status: 'all',
  fileType: 'all',
  publicationLevel: 'all',
  tag: 'all',
  lifecycle: 'active',
  viewMode: 'grid',
}

export function normalize(value?: string | string[] | number | null) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(', ').trim()
  }

  return String(value ?? '').trim()
}

export function lower(value?: string | string[] | number | null) {
  return normalize(value).toLowerCase()
}

export function normalizeSearch(value?: string | string[] | number | null) {
  return normalize(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function uniq(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map(normalize).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  )
}

export function optionUnion(values: string[], existing: string[]) {
  return Array.from(new Set([...values, ...existing].filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  )
}

export function getFamily(doc: LibraryDocumentRow) {
  return (
    normalize(doc.family) ||
    normalize(doc.subcategory) ||
    normalize(doc.category) ||
    normalize(doc.document_type) ||
    'Document BCVB'
  )
}

export function getCategory(doc: LibraryDocumentRow) {
  return normalize(doc.category_code) || normalize(doc.category) || normalize(doc.team_code) || 'Non classé'
}

export function getSubCategory(doc: LibraryDocumentRow) {
  return (
    normalize(doc.subCategory) ||
    normalize(doc.sub_category) ||
    normalize(doc.subcategory) ||
    normalize(doc.category_code) ||
    'Non renseignée'
  )
}

export function getTheme(doc: LibraryDocumentRow) {
  return normalize(doc.theme) || normalize(doc.theme_code) || 'Sans thème'
}

export function getSportCategory(doc: LibraryDocumentRow) {
  return (
    normalize(doc.sportCategory) ||
    normalize(doc.sport_category) ||
    normalize(doc.team_code) ||
    normalize(doc.category_code) ||
    'Toutes catégories'
  )
}

export function getAudience(doc: LibraryDocumentRow) {
  return normalize(doc.audience) || 'Club'
}

export function getSeason(doc: LibraryDocumentRow) {
  return normalize(doc.season) || 'Intemporel'
}

export function getStatus(doc: LibraryDocumentRow) {
  return normalize(doc.quality_status) || normalize(doc.status) || 'À contrôler'
}

export function getFileType(doc: LibraryDocumentRow) {
  const value = lower(doc.file_ext) || lower(doc.document_type)

  if (value.includes('pdf')) return 'PDF'
  if (value.includes('doc')) return 'DOCX'
  if (value.includes('image') || ['jpg', 'jpeg', 'png', 'webp'].includes(value)) return 'Image'
  if (value.includes('md') || value.includes('markdown')) return 'Markdown'
  if (value.includes('txt')) return 'Texte'

  return normalize(doc.document_type) || 'Source'
}

export function getPublicationLevel(doc: LibraryDocumentRow) {
  return (
    normalize(doc.publicationLevel) ||
    normalize(doc.publication_level) ||
    normalize(doc.level) ||
    (doc.is_featured ? 'Référence BCVB' : 'Club')
  )
}

export function getDocumentTitle(doc: LibraryDocumentRow) {
  return normalize(doc.title) || 'Document BCVB'
}

export function getDocumentDescription(doc: LibraryDocumentRow) {
  return (
    normalize(doc.description) ||
    normalize(doc.summary) ||
    'Document sans description, affiché avec métadonnées minimales.'
  )
}

export function getVersion(doc: LibraryDocumentRow) {
  return normalize(String(doc.version ?? '1.0'))
}

export function getSafeDateLabel(value?: string | null) {
  const date = new Date(value || '')

  if (Number.isNaN(date.getTime())) {
    return 'Date inconnue'
  }

  return date.toLocaleDateString('fr-FR')
}

export function getMobileUpdatedLabel(doc: LibraryDocumentRow) {
  const date = getSafeDateLabel(doc.updated_at || doc.created_at)

  if (date !== 'Date inconnue') {
    return date
  }

  return getSeason(doc)
}

export function hasPdf(doc: LibraryDocumentRow) {
  return Boolean(
    doc.pdf_url ||
      doc.pdf_storage_path ||
      doc.pdfPath ||
      doc.pdf_path ||
      lower(doc.file_ext).includes('pdf') ||
      lower(doc.document_type).includes('pdf'),
  )
}

export function hasSource(doc: LibraryDocumentRow) {
  return Boolean(
    doc.content?.trim() ||
      doc.source_markdown?.trim() ||
      doc.file_url ||
      doc.storage_path ||
      doc.sourcePath ||
      doc.source_path ||
      doc.sourceDownloadUrl ||
      doc.source_download_url ||
      doc.downloadUrl ||
      doc.download_url,
  )
}

export function canGeneratePdf(doc: LibraryDocumentRow) {
  return Boolean(doc.content?.trim() || doc.source_markdown?.trim())
}

export function hasVersions(doc: LibraryDocumentRow) {
  return Boolean(
    (doc.versions_count || 0) > 1 ||
      doc.parent_document_id ||
      doc.parentDocumentId ||
      doc.created_from_document_id ||
      doc.createdFromDocumentId,
  )
}

export function isArchived(doc: LibraryDocumentRow) {
  return Boolean(
    doc.isArchived ||
      doc.is_archived ||
      doc.archivedAt ||
      doc.archived_at ||
      lower(doc.status) === 'archived'
  )
}

export function isDeleted(doc: LibraryDocumentRow) {
  return Boolean(
    doc.isDeleted ||
      doc.is_deleted ||
      doc.deletedAt ||
      doc.deleted_at ||
      lower(doc.status) === 'deleted'
  )
}

export function isRecentDocument(doc: LibraryDocumentRow) {
  const date = new Date(doc.updated_at || doc.created_at || '')

  if (Number.isNaN(date.getTime())) {
    return false
  }

  return Date.now() - date.getTime() < 1000 * 60 * 60 * 24 * 30
}

export function buildSearchText(doc: LibraryDocumentRow) {
  return normalizeSearch(
    [
      doc.title,
      doc.description,
      doc.summary,
      doc.category,
      doc.subcategory,
      doc.subCategory,
      doc.sub_category,
      doc.theme,
      doc.category_code,
      doc.theme_code,
      doc.sportCategory,
      doc.sport_category,
      doc.team_code,
      doc.audience,
      doc.season,
      doc.status,
      doc.quality_status,
      doc.publication_level,
      doc.level,
      ...(doc.tags || []),
      doc.content?.slice(0, 800),
    ].join(' '),
  )
}

export function loadSavedFilters() {
  try {
    const raw = window.localStorage.getItem(FILTER_STORAGE_KEY)

    if (!raw) return defaultFilters

    return {
      ...defaultFilters,
      ...JSON.parse(raw),
    } as LibraryFilters
  } catch {
    return defaultFilters
  }
}

export function loadLocalDraftDocuments(): LibraryDocumentRow[] {
  try {
    const drafts = JSON.parse(
      window.localStorage.getItem('bcvb-editorial-library-drafts') || '[]',
    ) as Array<{
      title: string
      family?: string
      content: string
      score?: number
      savedAt?: string
    }>

    return drafts.map((draft, index) => {
      const savedAt = draft.savedAt || new Date().toISOString()
      const score = draft.score || 0

      return {
        id: `local-draft-${index}-${savedAt}`,
        title: draft.title || 'Brouillon bibliothèque',
        description: 'Brouillon enregistré depuis le Studio éditorial.',
        document_type: 'markdown',
        file_ext: 'md',
        bucket_name: '',
        storage_path: '',
        category: draft.family || 'Studio éditorial',
        family: draft.family || 'Fiche à thème',
        subcategory: draft.family || 'Document transformé',
        subCategory: 'Brouillon',
        theme: 'Transformation BCVB',
        sportCategory: 'Toutes catégories',
        category_code: draft.family || 'Studio',
        theme_code: 'Brouillon',
        team_code: null,
        audience: 'Admin',
        season: null,
        tags: ['BCVB', 'brouillon', 'studio'],
        content: draft.content,
        status: score >= 95 ? 'publiable' : 'à corriger',
        quality_status: score >= 95 ? 'Prêt à publier' : 'À corriger',
        publication_level: 'Brouillon',
        visibility: 'private',
        allowedRoles: ['admin'],
        is_active: true,
        is_featured: false,
        is_ai_generated: true,
        isArchived: false,
        isDeleted: false,
        uploaded_by: null,
        source_document_id: null,
        generation_request_id: null,
        version: '1.0',
        is_latest_version: true,
        created_at: savedAt,
        updated_at: savedAt,
      }
    })
  } catch {
    return []
  }
}

export function mapDocumentToMobileDocument(
  doc: LibraryDocumentRow,
  canTransform: boolean,
): LibraryMobileDocument {
  return {
    id: doc.id,
    title: getDocumentTitle(doc),
    description: getDocumentDescription(doc),
    family: getFamily(doc),
    mainCategory: getCategory(doc),
    subCategory: getSubCategory(doc),
    theme: getTheme(doc),
    audience: getAudience(doc),
    type: getFileType(doc),
    status: getStatus(doc),
    publicationLevel: getPublicationLevel(doc),
    updatedAt: getMobileUpdatedLabel(doc),
    createdAt: doc.created_at,
    to: doc.content?.trim() ? `/documents/${doc.id}` : '/bibliotheque',
    locked: false,
    canPreview: true,
    canDownload: hasSource(doc) || hasPdf(doc),
    canTransform: canTransform && hasSource(doc),
  }
}

export function toExportableDocument(doc: LibraryDocumentRow) {
  return {
    id: doc.id,
    title: getDocumentTitle(doc),
    content: doc.content || doc.source_markdown,
    source_markdown: doc.source_markdown,
    file_url: doc.file_url || doc.download_url || doc.downloadUrl,
    source_download_url: doc.source_download_url,
    sourceDownloadUrl: doc.sourceDownloadUrl,
    pdf_url: doc.pdf_url,
    bucket_name: doc.bucket_name,
    storage_path: doc.storage_path,
    updated_at: doc.updated_at,
  }
}
