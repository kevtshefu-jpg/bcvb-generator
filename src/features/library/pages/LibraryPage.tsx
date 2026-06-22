import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  archiveLibraryDocument,
  bulkArchiveLibraryDocuments,
  bulkDeleteLibraryDocuments,
  fetchLibraryDocuments,
  createLibraryDocumentSignedUrl,
  softDeleteLibraryDocument,
  type LibraryDocumentRow,
} from '../services/libraryService'
import { fetchDocumentVersions } from '../services/documentVersionService'

import { DocumentPreviewModal } from '../components/DocumentPreviewModal'
import LibraryBulkActionsBar from '../components/LibraryBulkActionsBar'
import LibraryDocumentGrid from '../components/LibraryDocumentGrid'
import LibraryEmptyState from '../components/LibraryEmptyState'
import LibraryFeedback from '../components/LibraryFeedback'
import LibraryFilters from '../components/LibraryFilters'
import LibraryHero from '../components/LibraryHero'
import LibraryMobileExperience from '../components/LibraryMobileExperience'
import LibraryStats from '../components/LibraryStats'

import { canAccessDocument, canTransformDocument } from '../utils/libraryPermissions'
import { useSafeLoading } from '../../../hooks/useSafeLoading'
import { PRESENTATION_MODE } from '../../../config/presentationMode'
import { useBulkSelection } from '../../../components/bulk'
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
import {
  FILTER_STORAGE_KEY,
  SCROLL_STORAGE_KEY,
  buildSearchText,
  canGeneratePdf,
  defaultFilters,
  getAudience,
  getCategory,
  getDocumentDescription,
  getDocumentTitle,
  getFamily,
  getFileType,
  getPublicationLevel,
  getSafeDateLabel,
  getSeason,
  getSportCategory,
  getStatus,
  getSubCategory,
  getTheme,
  getVersion,
  hasPdf,
  hasSource,
  hasVersions,
  isArchived,
  isDeleted,
  isRecentDocument,
  loadLocalDraftDocuments,
  loadSavedFilters,
  lower,
  mapDocumentToMobileDocument,
  normalizeSearch,
  optionUnion,
  toExportableDocument,
  uniq,
  type LibraryFilters as LibraryFilterValues,
} from '../utils/libraryPageHelpers'

import './LibraryPage.css'
import '../components/library-components.css'
import '../../documents/styles/document-actions.css'

/* =========================================================
   PAGE
========================================================= */

export default function LibraryPage() {
  const { user, profile } = useAuth()

  const [documents, setDocuments] = useState<LibraryDocumentRow[]>([])
  const [filters, setFilters] = useState<LibraryFilterValues>(() => loadSavedFilters())
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
    const ignoredKeys: Array<keyof LibraryFilterValues> = ['viewMode']
    const entries = Object.entries(filters) as Array<[keyof LibraryFilterValues, string]>

    return entries.filter(([key, value]) => {
      if (ignoredKeys.includes(key)) return false
      if (key === 'lifecycle') return value !== 'active'
      return value !== 'all' && value !== ''
    }).length
  }, [filters])

  const patchFilters = useCallback((patch: Partial<LibraryFilterValues>) => {
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
        const result = await bulkArchiveLibraryDocuments(remoteIds)

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
    // TODO: stocker le motif lorsque la colonne delete_reason sera ajoutée.

    try {
      setBulkActionLoading(true)
      setDownloadError(null)
      setActionMessage(null)

      const remoteIds = selectedDocuments
        .filter((doc) => !doc.id.startsWith('local-draft-'))
        .map((doc) => doc.id)

      if (remoteIds.length > 0) {
        const result = await bulkDeleteLibraryDocuments(remoteIds)

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

  const documentCardHelpers = useMemo(
    () => ({
      getFamily,
      getDocumentTitle,
      getDocumentDescription,
      getCategory,
      getSubCategory,
      getTheme,
      getSportCategory,
      getAudience,
      getSeason,
      getFileType,
      getPublicationLevel,
      getStatus,
      getVersion,
      getSafeDateLabel,
      hasPdf,
      hasSource,
      canGeneratePdf,
      hasVersions,
      isArchived,
      isDeleted,
      canExportMarkdown: (doc: LibraryDocumentRow) =>
        canExportDocument(toExportableDocument(doc), 'markdown'),
    }),
    [],
  )

  return (
    <section className="library-page bcvb-page bcvb-premium-page">
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
        <LibraryHero
          totalCount={visibleDocuments.length}
          visibleCount={filteredDocuments.length}
          loading={safeLoading}
          presentationMode={PRESENTATION_MODE}
          viewMode={filters.viewMode}
          onViewModeChange={(viewMode) => patchFilters({ viewMode })}
        />

        <LibraryStats
          totalCount={stats.total}
          publishedCount={stats.publishable}
          draftCount={stats.toFix}
          archivedCount={stats.archived}
          selectedCount={selectedCount}
          withoutPdfCount={stats.withoutPdf}
          transformableCount={stats.transformable}
          recentCount={stats.recent}
          showArchived={isAdminRole}
        />

        <LibraryFilters
          filters={filters}
          filterOptions={filterOptions}
          activeFilterCount={activeFilterCount}
          isAdmin={isAdminRole}
          selectionMode={selectionMode}
          onPatchFilters={patchFilters}
          onResetFilters={resetFilters}
          onReload={loadDocuments}
          onToggleSelectionMode={toggleSelectionMode}
        >
          <section className="library-results">
            <LibraryFeedback
              safeLoading={safeLoading}
              hasTimedOut={hasTimedOut}
              presentationMode={PRESENTATION_MODE}
              error={error}
              downloadError={downloadError}
              actionMessage={actionMessage}
              exportLoadingId={exportLoadingId}
              exportLoadingMessage={exportLoadingMessage}
              exportError={exportError}
              exportSuccess={exportSuccess}
              onRetry={loadDocuments}
              onCloseDownloadError={() => setDownloadError(null)}
              onCloseActionMessage={() => setActionMessage(null)}
              onClearExportFeedback={clearExportFeedback}
            />

            {selectionMode && isAdminRole ? (
              <LibraryBulkActionsBar
                selectedCount={selectedCount}
                totalCount={filteredDocuments.length}
                onSelectAll={selectAll}
                onClear={clearSelection}
                onArchiveSelected={handleArchiveSelectedDocuments}
                onDeleteSelected={handleDeleteSelectedDocuments}
                onCancel={disableSelectionMode}
                isDeleting={bulkActionLoading}
              />
            ) : null}

            {!safeLoading && filteredDocuments.length === 0 ? (
              <LibraryEmptyState
                loading={safeLoading}
                hasDocuments={visibleDocuments.length > 0}
              />
            ) : null}

            <LibraryDocumentGrid
              documents={filteredDocuments}
              viewMode={filters.viewMode}
              selectionMode={selectionMode}
              isAdminRole={isAdminRole}
              transformAllowed={transformAllowed}
              openingId={openingId}
              adminActionId={adminActionId}
              exportLoadingId={exportLoadingId}
              exportLoadingType={exportLoadingType}
              helpers={documentCardHelpers}
              isSelected={isSelected}
              onToggleSelected={toggleSelected}
              onPreview={setPreviewDocument}
              onOpen={handleOpenDocument}
              onGeneratePdf={handleDownloadPdf}
              onDownloadSource={handleDownloadSource}
              onDownloadMarkdown={handleDownloadMarkdown}
              onTransform={handleTransform}
              onShowVersions={handleShowVersions}
              onArchive={handleArchive}
              onSoftDelete={handleSoftDelete}
            />
          </section>
        </LibraryFilters>
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
