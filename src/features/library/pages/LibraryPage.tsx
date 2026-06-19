import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  archiveLibraryDocument,
  archiveLibraryDocuments,
  fetchLibraryDocuments,
  createLibraryDocumentSignedUrl,
  softDeleteLibraryDocument,
  softDeleteLibraryDocuments,
  type LibraryDocumentRow,
} from '../services/libraryService'
import { fetchDocumentVersions } from '../services/documentVersionService'

import { DocumentPreviewModal } from '../components/DocumentPreviewModal'
import LibraryMobileExperience, {
  type LibraryMobileDocument,
} from '../components/LibraryMobileExperience'

import { canAccessDocument, canTransformDocument } from '../utils/libraryPermissions'
import { useSafeLoading } from '../../../hooks/useSafeLoading'
import { PRESENTATION_MODE } from '../../../config/presentationMode'
import ActionFeedback from '../../../components/feedback/ActionFeedback'
import {
  BulkSelectableCard,
  BulkSelectionToolbar,
  useBulkSelection,
} from '../../../components/bulk'
import { useDocumentExportActions } from '../../documents/hooks/useDocumentExportActions'
import { canExportDocument } from '../../documents/services/documentExportService'
import { useAuth } from '../../auth/context/AuthContext'
import {
  saveEditorialStudioState,
  defaultEditorialStudioState,
} from '../../../utils/editorialStudioStorage.js'

import {
  DOCUMENT_FAMILIES,
  DOCUMENT_MAIN_CATEGORIES,
  DOCUMENT_SUB_CATEGORIES,
  DOCUMENT_THEMES,
  PUBLICATION_LEVELS,
  SPORT_CATEGORIES,
} from '../../../config/documentModel.js'

import './LibraryPage.css'
import '../../documents/styles/document-actions.css'

type LibraryViewMode = 'grid' | 'list'

type LibraryFilters = {
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

const FILTER_STORAGE_KEY = 'bcvb-library-filters'
const SCROLL_STORAGE_KEY = 'bcvb-library-scroll-y'

const defaultFilters: LibraryFilters = {
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

/* =========================================================
   HELPERS
========================================================= */

function normalize(value?: string | string[] | number | null) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(', ').trim()
  }

  return String(value ?? '').trim()
}

function lower(value?: string | string[] | number | null) {
  return normalize(value).toLowerCase()
}

function normalizeSearch(value?: string | string[] | number | null) {
  return normalize(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function uniq(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map(normalize).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  )
}

function optionUnion(values: string[], existing: string[]) {
  return Array.from(new Set([...values, ...existing].filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  )
}

function getOptionLabel(value: string) {
  const labels: Record<string, string> = {
    all: 'Tous',
    active: 'Actifs',
    archived: 'Archivés',
    deleted: 'Supprimés',
  }

  return labels[value] || value
}

function getFamily(doc: LibraryDocumentRow) {
  return (
    normalize(doc.family) ||
    normalize(doc.subcategory) ||
    normalize(doc.category) ||
    normalize(doc.document_type) ||
    'Document BCVB'
  )
}

function getCategory(doc: LibraryDocumentRow) {
  return normalize(doc.category_code) || normalize(doc.category) || normalize(doc.team_code) || 'Non classé'
}

function getSubCategory(doc: LibraryDocumentRow) {
  return (
    normalize(doc.subCategory) ||
    normalize(doc.sub_category) ||
    normalize(doc.subcategory) ||
    normalize(doc.category_code) ||
    'Non renseignée'
  )
}

function getTheme(doc: LibraryDocumentRow) {
  return normalize(doc.theme) || normalize(doc.theme_code) || 'Sans thème'
}

function getSportCategory(doc: LibraryDocumentRow) {
  return (
    normalize(doc.sportCategory) ||
    normalize(doc.sport_category) ||
    normalize(doc.team_code) ||
    normalize(doc.category_code) ||
    'Toutes catégories'
  )
}

function getAudience(doc: LibraryDocumentRow) {
  return normalize(doc.audience) || 'Club'
}

function getSeason(doc: LibraryDocumentRow) {
  return normalize(doc.season) || 'Intemporel'
}

function getStatus(doc: LibraryDocumentRow) {
  return normalize(doc.quality_status) || normalize(doc.status) || 'À contrôler'
}

function getFileType(doc: LibraryDocumentRow) {
  const value = lower(doc.file_ext) || lower(doc.document_type)

  if (value.includes('pdf')) return 'PDF'
  if (value.includes('doc')) return 'DOCX'
  if (value.includes('image') || ['jpg', 'jpeg', 'png', 'webp'].includes(value)) return 'Image'
  if (value.includes('md') || value.includes('markdown')) return 'Markdown'
  if (value.includes('txt')) return 'Texte'

  return normalize(doc.document_type) || 'Source'
}

function getPublicationLevel(doc: LibraryDocumentRow) {
  return (
    normalize(doc.publicationLevel) ||
    normalize(doc.publication_level) ||
    normalize(doc.level) ||
    (doc.is_featured ? 'Référence BCVB' : 'Club')
  )
}

function getDocumentTitle(doc: LibraryDocumentRow) {
  return normalize(doc.title) || 'Document BCVB'
}

function getDocumentDescription(doc: LibraryDocumentRow) {
  return (
    normalize(doc.description) ||
    normalize(doc.summary) ||
    'Document sans description, affiché avec métadonnées minimales.'
  )
}

function getVersion(doc: LibraryDocumentRow) {
  return normalize(String(doc.version ?? '1.0'))
}

function getSafeDateLabel(value?: string | null) {
  const date = new Date(value || '')

  if (Number.isNaN(date.getTime())) {
    return 'Date inconnue'
  }

  return date.toLocaleDateString('fr-FR')
}

function getMobileUpdatedLabel(doc: LibraryDocumentRow) {
  const date = getSafeDateLabel(doc.updated_at || doc.created_at)

  if (date !== 'Date inconnue') {
    return date
  }

  return getSeason(doc)
}

function hasPdf(doc: LibraryDocumentRow) {
  return Boolean(
    doc.pdf_url ||
      doc.pdf_storage_path ||
      doc.pdfPath ||
      doc.pdf_path ||
      lower(doc.file_ext).includes('pdf') ||
      lower(doc.document_type).includes('pdf'),
  )
}

function hasSource(doc: LibraryDocumentRow) {
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

function canGeneratePdf(doc: LibraryDocumentRow) {
  return Boolean(doc.content?.trim() || doc.source_markdown?.trim())
}

function hasVersions(doc: LibraryDocumentRow) {
  return Boolean(
    (doc.versions_count || 0) > 1 ||
      doc.parent_document_id ||
      doc.parentDocumentId ||
      doc.created_from_document_id ||
      doc.createdFromDocumentId,
  )
}

function isArchived(doc: LibraryDocumentRow) {
  return Boolean(doc.isArchived || doc.is_archived || lower(doc.status) === 'archived')
}

function isDeleted(doc: LibraryDocumentRow) {
  return Boolean(doc.isDeleted || doc.is_deleted || lower(doc.status) === 'deleted')
}

function isRecentDocument(doc: LibraryDocumentRow) {
  const date = new Date(doc.updated_at || doc.created_at || '')

  if (Number.isNaN(date.getTime())) {
    return false
  }

  return Date.now() - date.getTime() < 1000 * 60 * 60 * 24 * 30
}

function buildSearchText(doc: LibraryDocumentRow) {
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

function loadSavedFilters() {
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

function loadLocalDraftDocuments(): LibraryDocumentRow[] {
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

function mapDocumentToMobileDocument(
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

function toExportableDocument(doc: LibraryDocumentRow) {
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

/* =========================================================
   PAGE
========================================================= */

export default function LibraryPage() {
  const { user, profile } = useAuth()

  const [documents, setDocuments] = useState<LibraryDocumentRow[]>([])
  const [filters, setFilters] = useState<LibraryFilters>(() => loadSavedFilters())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [adminActionId, setAdminActionId] = useState<string | null>(null)
  const [previewDocument, setPreviewDocument] = useState<LibraryDocumentRow | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const {
    exportLoadingId,
    exportLoadingType,
    exportLoadingMessage,
    error: exportError,
    success: exportSuccess,
    generatePdf,
    downloadSource,
    downloadMarkdown,
    clearExportFeedback,
  } = useDocumentExportActions()

  const { safeLoading, hasTimedOut } = useSafeLoading(loading, 2500)

  const role = profile?.role ?? 'member'
  const isAdminRole = role === 'admin'
  const isCoachRole = role === 'coach' || role === 'responsable_technique'

  const libraryUser = useMemo(
    () => ({
      id: user?.id,
      role: profile?.role,
      category_id: profile?.category_id,
    }),
    [user?.id, profile?.role, profile?.category_id],
  )

  const transformAllowed = canTransformDocument(libraryUser)

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const rows = await fetchLibraryDocuments()
      setDocuments([...rows, ...loadLocalDraftDocuments()])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors du chargement de la bibliothèque.',
      )
      setDocuments(loadLocalDraftDocuments())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  useEffect(() => {
    const scrollY = Number(window.localStorage.getItem(SCROLL_STORAGE_KEY) || 0)

    if (scrollY > 0) {
      window.requestAnimationFrame(() => window.scrollTo(0, scrollY))
    }

    const saveScroll = () => {
      window.localStorage.setItem(SCROLL_STORAGE_KEY, String(window.scrollY))
    }

    window.addEventListener('beforeunload', saveScroll)

    return () => {
      saveScroll()
      window.removeEventListener('beforeunload', saveScroll)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters))
  }, [filters])

  useEffect(() => {
    if (!actionMessage && !downloadError) return

    const timeout = window.setTimeout(() => {
      setActionMessage(null)
      setDownloadError(null)
    }, 4500)

    return () => window.clearTimeout(timeout)
  }, [actionMessage, downloadError])

  const visibleDocuments = useMemo(
    () =>
      documents.filter((doc) => {
        if (!canAccessDocument(libraryUser, doc)) return false
        if (!isAdminRole && (isArchived(doc) || isDeleted(doc))) return false

        if (filters.lifecycle === 'active') return !isArchived(doc) && !isDeleted(doc)
        if (filters.lifecycle === 'archived') return isArchived(doc)
        if (filters.lifecycle === 'deleted') return isDeleted(doc)

        return true
      }),
    [documents, filters.lifecycle, libraryUser, isAdminRole],
  )

  const filterOptions = useMemo(
    () => ({
      families: optionUnion(DOCUMENT_FAMILIES, uniq(visibleDocuments.map(getFamily))),
      categories: optionUnion(DOCUMENT_MAIN_CATEGORIES, uniq(visibleDocuments.map(getCategory))),
      subCategories: optionUnion(DOCUMENT_SUB_CATEGORIES, uniq(visibleDocuments.map(getSubCategory))),
      themes: optionUnion(DOCUMENT_THEMES, uniq(visibleDocuments.map(getTheme))),
      sportCategories: optionUnion(SPORT_CATEGORIES, uniq(visibleDocuments.map(getSportCategory))),
      audiences: uniq(visibleDocuments.map(getAudience)),
      seasons: uniq(visibleDocuments.map(getSeason)),
      statuses: uniq(visibleDocuments.map(getStatus)),
      fileTypes: uniq(visibleDocuments.map(getFileType)),
      publicationLevels: optionUnion(PUBLICATION_LEVELS, uniq(visibleDocuments.map(getPublicationLevel))),
      tags: uniq(visibleDocuments.flatMap((doc) => doc.tags || [])),
    }),
    [visibleDocuments],
  )

  const filteredDocuments = useMemo(() => {
    const search = normalizeSearch(filters.search)

    return visibleDocuments
      .filter((doc) => {
        const matchesSearch = !search || buildSearchText(doc).includes(search)
        const matchesFamily = filters.family === 'all' || getFamily(doc) === filters.family
        const matchesCategory = filters.category === 'all' || getCategory(doc) === filters.category
        const matchesSubCategory = filters.subCategory === 'all' || getSubCategory(doc) === filters.subCategory
        const matchesTheme = filters.theme === 'all' || getTheme(doc) === filters.theme
        const matchesSportCategory =
          filters.sportCategory === 'all' || getSportCategory(doc) === filters.sportCategory
        const matchesAudience = filters.audience === 'all' || getAudience(doc) === filters.audience
        const matchesSeason = filters.season === 'all' || getSeason(doc) === filters.season
        const matchesStatus = filters.status === 'all' || getStatus(doc) === filters.status
        const matchesFileType = filters.fileType === 'all' || getFileType(doc) === filters.fileType
        const matchesPublicationLevel =
          filters.publicationLevel === 'all' || getPublicationLevel(doc) === filters.publicationLevel
        const matchesTag = filters.tag === 'all' || (doc.tags || []).includes(filters.tag)

        return (
          matchesSearch &&
          matchesFamily &&
          matchesCategory &&
          matchesSubCategory &&
          matchesTheme &&
          matchesSportCategory &&
          matchesAudience &&
          matchesSeason &&
          matchesStatus &&
          matchesFileType &&
          matchesPublicationLevel &&
          matchesTag
        )
      })
      .sort((a, b) => {
        if (Boolean(b.is_featured) !== Boolean(a.is_featured)) {
          return Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured))
        }

        const dateA = new Date(a.updated_at || a.created_at || '').getTime()
        const dateB = new Date(b.updated_at || b.created_at || '').getTime()

        return (Number.isNaN(dateB) ? 0 : dateB) - (Number.isNaN(dateA) ? 0 : dateA)
      })
  }, [filters, visibleDocuments])

  const mobileDocuments = useMemo(
    () => visibleDocuments.map((doc) => mapDocumentToMobileDocument(doc, transformAllowed)),
    [visibleDocuments, transformAllowed],
  )

  const stats = useMemo(
    () => ({
      total: filteredDocuments.length,
      publishable: filteredDocuments.filter((doc) =>
        /publiable|prêt|published|ready/i.test(`${doc.status} ${doc.quality_status}`),
      ).length,
      toFix: filteredDocuments.filter((doc) =>
        /corriger|draft|brouillon|review|à contrôler/i.test(`${doc.status} ${doc.quality_status}`),
      ).length,
      withoutPdf: filteredDocuments.filter((doc) => !hasPdf(doc)).length,
      transformable: filteredDocuments.filter((doc) => transformAllowed && hasSource(doc)).length,
      recent: filteredDocuments.filter(isRecentDocument).length,
      archived: filteredDocuments.filter(isArchived).length,
    }),
    [filteredDocuments, transformAllowed],
  )

  const {
    selectedIds,
    selectedCount,
    isSelected,
    toggleSelected,
    selectAll,
    clearSelection,
    selectionMode,
    toggleSelectionMode,
    disableSelectionMode,
  } = useBulkSelection(filteredDocuments)

  const selectedDocuments = useMemo(
    () => filteredDocuments.filter((doc) => selectedIds.has(doc.id)),
    [filteredDocuments, selectedIds],
  )

  const activeFilterCount = useMemo(() => {
    const ignoredKeys: Array<keyof LibraryFilters> = ['viewMode']
    const entries = Object.entries(filters) as Array<[keyof LibraryFilters, string]>

    return entries.filter(([key, value]) => {
      if (ignoredKeys.includes(key)) return false
      if (key === 'lifecycle') return value !== 'active'
      return value !== 'all' && value !== ''
    }).length
  }, [filters])

  const patchFilters = useCallback((patch: Partial<LibraryFilters>) => {
    setFilters((current) => ({
      ...current,
      ...patch,
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
    setActionMessage('Filtres réinitialisés.')
  }, [])

  const findDocumentById = useCallback(
    (documentId: string) => documents.find((document) => document.id === documentId),
    [documents],
  )

  async function handleOpenDocument(doc: LibraryDocumentRow) {
    try {
      setError(null)
      setDownloadError(null)
      setOpeningId(doc.id)

      if (doc.content?.trim()) {
        if (doc.id.startsWith('local-draft-')) {
          setPreviewDocument(doc)
          return
        }

        window.location.href = `/documents/${doc.id}`
        return
      }

      if (!doc.bucket_name || !doc.storage_path) {
        throw new Error('Ce document ne contient ni contenu texte intégré, ni fichier associé.')
      }

      const signedUrl = await createLibraryDocumentSignedUrl(doc.bucket_name, doc.storage_path)
      window.open(signedUrl, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d’ouvrir le document.')
    } finally {
      setOpeningId(null)
    }
  }

  async function handleDownloadPdf(doc: LibraryDocumentRow) {
    setDownloadError(null)
    setActionMessage(null)

    if (hasPdf(doc) && (doc.pdf_url || doc.pdf_storage_path || lower(doc.file_ext).includes('pdf'))) {
      await downloadSource({
        ...toExportableDocument(doc),
        file_url: doc.pdf_url || doc.file_url,
        storage_path: doc.pdf_storage_path || doc.storage_path,
      })
      return
    }

    await generatePdf(toExportableDocument(doc))
  }

  async function handleDownloadSource(doc: LibraryDocumentRow) {
    setDownloadError(null)
    setActionMessage(null)
    await downloadSource(toExportableDocument(doc))
  }

  async function handleDownloadMarkdown(doc: LibraryDocumentRow) {
    setDownloadError(null)
    setActionMessage(null)
    await downloadMarkdown(toExportableDocument(doc))
  }

  async function handleCopySource(doc: LibraryDocumentRow) {
    const source = doc.content?.trim() || doc.source_markdown?.trim()

    if (!source) {
      setActionMessage('Aucune source texte disponible à copier.')
      return
    }

    try {
      await navigator.clipboard.writeText(source)
      setActionMessage('Source copiée.')
    } catch {
      setDownloadError('Impossible de copier la source dans le presse-papiers.')
    }
  }

  function handleTransform(doc: LibraryDocumentRow) {
    const source = doc.content || doc.source_markdown || doc.description || doc.summary || ''
    const now = new Date().toISOString()

    saveEditorialStudioState({
      ...defaultEditorialStudioState,
      targetDocument: `${getDocumentTitle(doc)} - version BCVB`,
      family: getFamily(doc),
      category: getCategory(doc),
      audience: getAudience(doc),
      season: getSeason(doc),
      sourceText: source,
      sourceDocumentId: doc.id,
      transformedFromTitle: getDocumentTitle(doc),
      transformationDate: now,
      transformationMode: 'bcvb_upgrade',
      createdFromDocumentId: doc.id,
      parentDocumentId: doc.id,
      isLatestVersion: true,
      recommendedAction: 'Construire le plan éditorial puis lancer une transformation BCVB.',
      steps: {
        framing: 'validé',
        sources: source ? 'validé' : 'à corriger',
        plan: 'en cours',
        production: 'non démarré',
        quality: 'non démarré',
        export: 'non démarré',
      },
      updatedAt: now,
    })

    window.location.href = '/admin/documents/transformer'
  }

  async function handleShowVersions(doc: LibraryDocumentRow) {
    try {
      setDownloadError(null)

      const versions = await fetchDocumentVersions(doc.id)
      const declaredCount = Number(doc.versions_count || 0)

      if (versions.length > 0) {
        const latestVersion = versions.find((version) => version.isLatestVersion) ?? versions[0]
        setActionMessage(
          `Version actuelle ${latestVersion.version}. ${versions.length} version(s) locale(s) conservée(s). Dernière sauvegarde : ${getSafeDateLabel(latestVersion.createdAt)}.`,
        )
        return
      }

      if (declaredCount > 1) {
        setActionMessage(
          `Version actuelle ${getVersion(doc)}. ${declaredCount} version(s) déclarée(s) côté bibliothèque ; l’historique détaillé sera branché au stockage documentaire.`,
        )
        return
      }

      setActionMessage(
        `Version actuelle ${getVersion(doc)}. Versions à venir : aucun historique détaillé n’est encore disponible pour ce document.`,
      )
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Historique de versions indisponible.')
    }
  }

  async function handleArchive(doc: LibraryDocumentRow) {
    if (!isAdminRole) return

    const confirmed = window.confirm(
      `Archiver "${getDocumentTitle(doc)}" ? Le document sera retiré de la vue active sans être supprimé définitivement.`,
    )

    if (!confirmed) return

    try {
      setAdminActionId(doc.id)

      if (!doc.id.startsWith('local-draft-')) {
        await archiveLibraryDocument(doc.id, user?.id)
      }

      setDocuments((current) =>
        current.map((item) =>
          item.id === doc.id
            ? {
                ...item,
                is_archived: true,
                status: 'archived',
                updated_at: new Date().toISOString(),
              }
            : item,
        ),
      )

      setActionMessage('Document archivé.')
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Archivage impossible.')
    } finally {
      setAdminActionId(null)
    }
  }

  async function handleSoftDelete(doc: LibraryDocumentRow) {
    if (!isAdminRole) return

    const reason = window.prompt(`Motif de suppression douce pour "${getDocumentTitle(doc)}" :`)

    if (!reason?.trim()) {
      setActionMessage('Suppression annulée : le motif est obligatoire.')
      return
    }

    try {
      setAdminActionId(doc.id)

      if (!doc.id.startsWith('local-draft-')) {
        await softDeleteLibraryDocument(doc.id, user?.id, reason.trim())
      }

      setDocuments((current) =>
        current.map((item) =>
          item.id === doc.id
            ? {
                ...item,
                is_deleted: true,
                delete_reason: reason.trim(),
                status: 'deleted',
                is_active: false,
                updated_at: new Date().toISOString(),
              }
            : item,
        ),
      )

      setActionMessage('Document supprimé de façon sécurisée.')
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Suppression sécurisée impossible.')
    } finally {
      setAdminActionId(null)
    }
  }

  async function handleArchiveSelectedDocuments() {
    if (!isAdminRole || selectedDocuments.length === 0) return

    const confirmed = window.confirm(
      `Archiver ${selectedDocuments.length} document(s) ? Ils seront retirés de la vue active sans suppression définitive.`,
    )

    if (!confirmed) return

    try {
      setBulkActionLoading(true)
      setDownloadError(null)
      setActionMessage(null)

      const remoteIds = selectedDocuments
        .filter((doc) => !doc.id.startsWith('local-draft-'))
        .map((doc) => doc.id)

      if (remoteIds.length > 0) {
        const result = await archiveLibraryDocuments(remoteIds, user?.id)

        if (!result.ok) {
          throw new Error(result.error || 'Archivage groupé impossible.')
        }
      }

      const selectedSet = new Set(selectedDocuments.map((doc) => doc.id))
      const now = new Date().toISOString()

      setDocuments((current) =>
        current.map((item) =>
          selectedSet.has(item.id)
            ? {
                ...item,
                is_archived: true,
                isArchived: true,
                status: 'archived',
                updated_at: now,
              }
            : item,
        ),
      )

      clearSelection()
      setActionMessage(`${selectedDocuments.length} document(s) archivé(s).`)
      await loadDocuments()
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Archivage groupé impossible.')
    } finally {
      setBulkActionLoading(false)
    }
  }

  async function handleDeleteSelectedDocuments() {
    if (!isAdminRole || selectedDocuments.length === 0) return

    const confirmed = window.confirm(
      `Supprimer ${selectedDocuments.length} document(s) ? Cette action peut être irréversible selon la configuration.`,
    )

    if (!confirmed) return

    const reason = window.prompt(
      'Motif de suppression groupée :',
      'Suppression groupée depuis la bibliothèque BCVB',
    )

    if (reason === null) return

    try {
      setBulkActionLoading(true)
      setDownloadError(null)
      setActionMessage(null)

      const remoteIds = selectedDocuments
        .filter((doc) => !doc.id.startsWith('local-draft-'))
        .map((doc) => doc.id)

      if (remoteIds.length > 0) {
        const result = await softDeleteLibraryDocuments(
          remoteIds,
          user?.id,
          reason.trim() || 'Suppression groupée depuis la bibliothèque BCVB',
        )

        if (!result.ok) {
          throw new Error(result.error || 'Suppression groupée impossible.')
        }
      }

      const selectedSet = new Set(selectedDocuments.map((doc) => doc.id))
      const now = new Date().toISOString()

      setDocuments((current) =>
        current.map((item) =>
          selectedSet.has(item.id)
            ? {
                ...item,
                is_deleted: true,
                isDeleted: true,
                is_active: false,
                delete_reason: reason.trim() || 'Suppression groupée depuis la bibliothèque BCVB',
                status: 'deleted',
                updated_at: now,
              }
            : item,
        ),
      )

      clearSelection()
      setActionMessage(`${selectedDocuments.length} document(s) supprimé(s) de façon sécurisée.`)
      await loadDocuments()
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Suppression groupée impossible.')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleMobilePreviewDocument = useCallback(
    (documentId: string) => {
      const selectedDocument = findDocumentById(documentId)

      if (!selectedDocument) return

      setPreviewDocument(selectedDocument)
    },
    [findDocumentById],
  )

  const handleMobileDownloadDocument = useCallback(
    async (documentId: string) => {
      const selectedDocument = findDocumentById(documentId)

      if (!selectedDocument) return

      await handleDownloadSource(selectedDocument)
    },
    [findDocumentById],
  )

  const handleMobileTransformDocument = useCallback(
    (documentId: string) => {
      const selectedDocument = findDocumentById(documentId)

      if (!selectedDocument) return

      handleTransform(selectedDocument)
    },
    [findDocumentById],
  )

  function renderSelect(label: string, key: keyof LibraryFilters, values: string[]) {
    const cleanedValues = values.filter((value) => value !== 'all')

    return (
      <label className="library-filter">
        <span>{label}</span>

        <select
          value={filters[key]}
          onChange={(event) =>
            patchFilters({
              [key]: event.target.value,
            } as Partial<LibraryFilters>)
          }
        >
          <option value="all">Tous</option>

          {cleanedValues.map((value) => (
            <option value={value} key={value}>
              {getOptionLabel(value)}
            </option>
          ))}
        </select>
      </label>
    )
  }

  return (
    <section className="library-page bcvb-page">
      <LibraryMobileExperience
        documents={mobileDocuments}
        isAdmin={isAdminRole}
        isCoach={isCoachRole}
        isLoading={safeLoading}
        error={error}
        onPreviewDocument={handleMobilePreviewDocument}
        onDownloadDocument={handleMobileDownloadDocument}
        onTransformDocument={handleMobileTransformDocument}
      />

      <div className="library-desktop-first">
        <section className="library-hero">
          <div>
            <p className="bcvb-eyebrow">
              {PRESENTATION_MODE ? 'Mode présentation' : 'Bibliothèque documentaire'}
            </p>

            <h1>Centre de ressources BCVB</h1>

            <p>
              Consulter, rechercher, ouvrir, prévisualiser, télécharger et transformer les documents du club selon les droits du profil connecté.
            </p>
          </div>

          <div className="library-view-toggle">
            <button
              type="button"
              className={filters.viewMode === 'grid' ? 'is-active' : ''}
              onClick={() => patchFilters({ viewMode: 'grid' })}
            >
              Grille
            </button>

            <button
              type="button"
              className={filters.viewMode === 'list' ? 'is-active' : ''}
              onClick={() => patchFilters({ viewMode: 'list' })}
            >
              Liste
            </button>
          </div>
        </section>

        <section className="library-stats">
          <article>
            <span>Documents visibles</span>
            <strong>{stats.total}</strong>
          </article>

          <article>
            <span>Publiables</span>
            <strong>{stats.publishable}</strong>
          </article>

          <article>
            <span>À corriger</span>
            <strong>{stats.toFix}</strong>
          </article>

          <article>
            <span>Sans PDF</span>
            <strong>{stats.withoutPdf}</strong>
          </article>

          <article>
            <span>Transformables</span>
            <strong>{stats.transformable}</strong>
          </article>

          <article>
            <span>Récents</span>
            <strong>{stats.recent}</strong>
          </article>

          {isAdminRole ? (
            <article>
              <span>Archivés</span>
              <strong>{stats.archived}</strong>
            </article>
          ) : null}
        </section>

        <section className="library-toolbar">
          <label className="library-search">
            <span>Recherche texte / sémantique simple</span>

            <input
              value={filters.search}
              onChange={(event) => patchFilters({ search: event.target.value })}
              placeholder="Titre, description, catégorie, tags, résumé, métadonnées..."
            />
          </label>

          <div className="library-toolbar__actions">
            {isAdminRole ? (
              <button type="button" onClick={toggleSelectionMode}>
                {selectionMode ? 'Quitter sélection' : 'Sélection multiple'}
              </button>
            ) : null}

            <button type="button" onClick={resetFilters}>
              Réinitialiser filtres
            </button>

            <button type="button" onClick={loadDocuments}>
              Recharger
            </button>
          </div>
        </section>

        {activeFilterCount > 0 ? (
          <p className="library-action-message">
            {activeFilterCount} filtre{activeFilterCount > 1 ? 's' : ''} actif
            {activeFilterCount > 1 ? 's' : ''}.
          </p>
        ) : null}

        <div className="library-layout">
          <aside className="library-filters">
            <h2>Classement</h2>

            {renderSelect('Famille documentaire', 'family', filterOptions.families)}
            {renderSelect('Catégorie principale', 'category', filterOptions.categories)}
            {renderSelect('Sous-catégorie', 'subCategory', filterOptions.subCategories)}
            {renderSelect('Thème', 'theme', filterOptions.themes)}
            {renderSelect('Catégorie sportive', 'sportCategory', filterOptions.sportCategories)}
            {renderSelect('Audience', 'audience', filterOptions.audiences)}
            {renderSelect('Saison', 'season', filterOptions.seasons)}
            {renderSelect('Statut', 'status', filterOptions.statuses)}
            {renderSelect('Type de fichier', 'fileType', filterOptions.fileTypes)}
            {renderSelect('Niveau publication', 'publicationLevel', filterOptions.publicationLevels)}
            {renderSelect('Tags', 'tag', filterOptions.tags)}

            {isAdminRole
              ? renderSelect('Cycle de vie', 'lifecycle', ['active', 'archived', 'deleted', 'all'])
              : null}
          </aside>

          <section className="library-results">
            {safeLoading ? <p>Chargement de l’espace BCVB...</p> : null}

            {hasTimedOut && PRESENTATION_MODE ? (
              <div className="bcvb-demo-fallback">
                <p className="bcvb-eyebrow">Mode présentation</p>
                <h2>Bibliothèque prête à être présentée</h2>
                <p>
                  Le chargement distant est temporairement indisponible. Les brouillons locaux restent affichables.
                </p>
              </div>
            ) : null}

            {error ? (
              <div className="bcvb-demo-fallback">
                <p className="bcvb-eyebrow">Bibliothèque</p>
                <h2>Chargement temporairement indisponible</h2>
                <p>
                  {PRESENTATION_MODE
                    ? 'La bibliothèque reste disponible dès que la connexion aux données répond.'
                    : error}
                </p>

                <button type="button" onClick={loadDocuments}>
                  Réessayer
                </button>
              </div>
            ) : null}

            {downloadError ? (
              <ActionFeedback
                type="error"
                title="Action indisponible"
                message={downloadError}
                onClose={() => setDownloadError(null)}
              />
            ) : null}

            {exportLoadingId && exportLoadingMessage ? (
              <ActionFeedback
                type="loading"
                title="Export documentaire"
                message={exportLoadingMessage}
              />
            ) : null}

            {exportError ? (
              <ActionFeedback
                type="error"
                title="Export impossible"
                message={exportError}
                onClose={clearExportFeedback}
              />
            ) : null}

            {exportSuccess ? (
              <ActionFeedback
                type="success"
                title="Export terminé"
                message={exportSuccess}
                onClose={clearExportFeedback}
              />
            ) : null}

            {actionMessage ? (
              <ActionFeedback
                type="success"
                title="Bibliothèque"
                message={actionMessage}
                onClose={() => setActionMessage(null)}
              />
            ) : null}

            {selectionMode && isAdminRole ? (
              <BulkSelectionToolbar
                selectedCount={selectedCount}
                totalCount={filteredDocuments.length}
                onSelectAll={selectAll}
                onClear={clearSelection}
                onArchiveSelected={handleArchiveSelectedDocuments}
                onDeleteSelected={handleDeleteSelectedDocuments}
                onCancel={disableSelectionMode}
                archiveLabel="Archiver sélection"
                deleteLabel="Supprimer sélection"
                isDeleting={bulkActionLoading}
              />
            ) : null}

            {!safeLoading && filteredDocuments.length === 0 ? (
              <article className="library-empty">
                <h3>Aucun document visible</h3>
                <p>Aucun document ne correspond aux filtres ou aux droits du profil connecté.</p>
              </article>
            ) : null}

            <div className={`library-documents library-documents--${filters.viewMode}`}>
              {filteredDocuments.map((doc) => {
                const sourceAvailable = hasSource(doc)
                const pdfAvailable = hasPdf(doc)
                const canPdf = pdfAvailable || canGeneratePdf(doc)
                const exportableDoc = toExportableDocument(doc)
                const markdownAvailable = canExportDocument(exportableDoc, 'markdown')
                const isCurrentExportLoading = exportLoadingId === doc.id
                const pdfLabel =
                  isCurrentExportLoading && exportLoadingType === 'pdf'
                    ? 'Préparation PDF...'
                    : isCurrentExportLoading && exportLoadingType === 'source'
                      ? 'Téléchargement...'
                      : pdfAvailable
                        ? 'Télécharger PDF'
                        : canGeneratePdf(doc)
                          ? 'Générer PDF'
                          : 'PDF indisponible'

                return (
                  <BulkSelectableCard
                    key={doc.id}
                    selected={isSelected(doc.id)}
                    selectionMode={selectionMode && isAdminRole}
                    onToggleSelected={() => toggleSelected(doc.id)}
                  >
                  <article className="library-card">
                    <header>
                      <div>
                        <p className="bcvb-eyebrow">{getFamily(doc)}</p>
                        <h2>{getDocumentTitle(doc)}</h2>
                      </div>

                      <span
                        className={`library-card__status ${
                          /corriger|draft|brouillon/i.test(getStatus(doc))
                            ? 'is-warning'
                            : 'is-ready'
                        }`}
                      >
                        {getStatus(doc)}
                      </span>
                    </header>

                    <p className="library-card__description">
                      {getDocumentDescription(doc)}
                    </p>

                    <div className="library-card__meta">
                      <span>{getCategory(doc)}</span>
                      <span>{getSubCategory(doc)}</span>
                      <span>{getTheme(doc)}</span>
                      <span>{getSportCategory(doc)}</span>
                      <span>{getAudience(doc)}</span>
                      <span>{getSeason(doc)}</span>
                      <span>{getFileType(doc)}</span>
                      <span>{getPublicationLevel(doc)}</span>
                    </div>

                    <div className="library-card__tags">
                      {(doc.tags?.length ? doc.tags : ['BCVB']).slice(0, 6).map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>

                    <div className="library-card__version">
                      <span>Version actuelle {getVersion(doc)}</span>
                      <span>Modifié le {getSafeDateLabel(doc.updated_at || doc.created_at)}</span>

                      {hasVersions(doc) ? (
                        <button
                          type="button"
                          onClick={() => handleShowVersions(doc)}
                        >
                          Voir versions
                        </button>
                      ) : (
                        <span className="library-card__version-note">Versions à venir</span>
                      )}
                    </div>

                    <div className="library-card__actions document-action-row">
                      <button
                        type="button"
                        className="document-action-button document-action-button--primary"
                        onClick={() => handleOpenDocument(doc)}
                        disabled={openingId === doc.id}
                      >
                        {openingId === doc.id ? 'Ouverture...' : 'Ouvrir'}
                      </button>

                      <button
                        type="button"
                        className="document-action-button document-action-button--ghost"
                        onClick={() => setPreviewDocument(doc)}
                      >
                        Prévisualiser
                      </button>

                      <button
                        type="button"
                        className={[
                          'document-action-button',
                          pdfAvailable ? 'document-action-button--ghost' : 'document-action-button--primary',
                          isCurrentExportLoading ? 'document-action-button--loading' : '',
                        ].filter(Boolean).join(' ')}
                        onClick={() => handleDownloadPdf(doc)}
                        disabled={!canPdf || isCurrentExportLoading}
                        title={!canPdf ? 'PDF à générer, mais aucune source exploitable.' : undefined}
                      >
                        {pdfLabel}
                      </button>

                      <button
                        type="button"
                        className={[
                          'document-action-button',
                          'document-action-button--ghost',
                          isCurrentExportLoading && exportLoadingType === 'source'
                            ? 'document-action-button--loading'
                            : '',
                        ].filter(Boolean).join(' ')}
                        onClick={() => handleDownloadSource(doc)}
                        disabled={!sourceAvailable || isCurrentExportLoading}
                        title={!sourceAvailable ? 'Source indisponible.' : undefined}
                      >
                        {isCurrentExportLoading && exportLoadingType === 'source'
                          ? 'Téléchargement...'
                          : sourceAvailable ? 'Télécharger source' : 'Source indisponible'}
                      </button>

                      <button
                        type="button"
                        className={[
                          'document-action-button',
                          'document-action-button--ghost',
                          isCurrentExportLoading && exportLoadingType === 'markdown'
                            ? 'document-action-button--loading'
                            : '',
                        ].filter(Boolean).join(' ')}
                        onClick={() => handleDownloadMarkdown(doc)}
                        disabled={!markdownAvailable || isCurrentExportLoading}
                        title={!markdownAvailable ? 'Source Markdown indisponible.' : undefined}
                      >
                        {isCurrentExportLoading && exportLoadingType === 'markdown'
                          ? 'Préparation Markdown...'
                          : 'Markdown'}
                      </button>

                      {transformAllowed ? (
                        <button
                          type="button"
                          className="document-action-button document-action-button--ghost"
                          onClick={() => handleTransform(doc)}
                          disabled={!sourceAvailable}
                          title={!sourceAvailable ? 'Transformation impossible : source indisponible.' : undefined}
                        >
                          Transformer BCVB
                        </button>
                      ) : (
                        <span className="library-card__hint">
                          Transformation réservée admin.
                        </span>
                      )}

                      {isAdminRole ? (
                        <>
                          <button
                            type="button"
                            className="document-action-button document-action-button--ghost"
                            onClick={() => handleArchive(doc)}
                            disabled={adminActionId === doc.id || isArchived(doc) || isDeleted(doc)}
                          >
                            {isArchived(doc) ? 'Archivé' : 'Archiver'}
                          </button>

                          <button
                            type="button"
                            className="document-action-button document-action-button--danger library-card__danger"
                            onClick={() => handleSoftDelete(doc)}
                            disabled={adminActionId === doc.id || isDeleted(doc)}
                          >
                            {isDeleted(doc) ? 'Supprimé' : 'Supprimer'}
                          </button>
                        </>
                      ) : null}
                    </div>
                  </article>
                  </BulkSelectableCard>
                )
              })}
            </div>
          </section>
        </div>
      </div>

      {previewDocument ? (
        <DocumentPreviewModal
          document={previewDocument}
          canTransform={transformAllowed}
          onClose={() => setPreviewDocument(null)}
          onOpen={handleOpenDocument}
          onDownloadPdf={handleDownloadPdf}
          onDownloadSource={handleDownloadSource}
          onTransform={handleTransform}
          onCopySource={handleCopySource}
          exportLoadingId={exportLoadingId}
          exportLoadingType={exportLoadingType}
        />
      ) : null}
    </section>
  )
}
