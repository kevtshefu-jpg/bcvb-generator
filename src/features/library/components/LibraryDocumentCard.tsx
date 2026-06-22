import { BulkSelectableCard } from '../../../components/bulk'
import type { LibraryDocumentRow } from '../services/libraryService'

export type LibraryDocumentCardHelpers = {
  getFamily: (document: LibraryDocumentRow) => string
  getDocumentTitle: (document: LibraryDocumentRow) => string
  getDocumentDescription: (document: LibraryDocumentRow) => string
  getCategory: (document: LibraryDocumentRow) => string
  getSubCategory: (document: LibraryDocumentRow) => string
  getTheme: (document: LibraryDocumentRow) => string
  getSportCategory: (document: LibraryDocumentRow) => string
  getAudience: (document: LibraryDocumentRow) => string
  getSeason: (document: LibraryDocumentRow) => string
  getFileType: (document: LibraryDocumentRow) => string
  getPublicationLevel: (document: LibraryDocumentRow) => string
  getStatus: (document: LibraryDocumentRow) => string
  getVersion: (document: LibraryDocumentRow) => string
  getSafeDateLabel: (value?: string | null) => string
  hasPdf: (document: LibraryDocumentRow) => boolean
  hasSource: (document: LibraryDocumentRow) => boolean
  canGeneratePdf: (document: LibraryDocumentRow) => boolean
  hasVersions: (document: LibraryDocumentRow) => boolean
  isArchived: (document: LibraryDocumentRow) => boolean
  isDeleted: (document: LibraryDocumentRow) => boolean
  canExportMarkdown: (document: LibraryDocumentRow) => boolean
}

type ExportLoadingType = 'pdf' | 'source' | 'markdown' | null

type LibraryDocumentCardProps = {
  document: LibraryDocumentRow
  selected?: boolean
  selectionMode?: boolean
  isAdminRole: boolean
  transformAllowed: boolean
  openingId: string | null
  adminActionId: string | null
  exportLoadingId: string | null
  exportLoadingType: ExportLoadingType
  helpers: LibraryDocumentCardHelpers
  onToggleSelected: () => void
  onPreview: () => void
  onOpen: () => void
  onGeneratePdf: () => void
  onDownloadSource: () => void
  onDownloadMarkdown: () => void
  onTransform: () => void
  onShowVersions: () => void
  onArchive: () => void
  onSoftDelete: () => void
}

export default function LibraryDocumentCard({
  document,
  selected = false,
  selectionMode = false,
  isAdminRole,
  transformAllowed,
  openingId,
  adminActionId,
  exportLoadingId,
  exportLoadingType,
  helpers,
  onToggleSelected,
  onPreview,
  onOpen,
  onGeneratePdf,
  onDownloadSource,
  onDownloadMarkdown,
  onTransform,
  onShowVersions,
  onArchive,
  onSoftDelete,
}: LibraryDocumentCardProps) {
  const sourceAvailable = helpers.hasSource(document)
  const pdfAvailable = helpers.hasPdf(document)
  const canPdf = pdfAvailable || helpers.canGeneratePdf(document)
  const markdownAvailable = helpers.canExportMarkdown(document)
  const isCurrentExportLoading = exportLoadingId === document.id
  const rawTags = document.tags?.length ? document.tags : ['BCVB']
  const visibleTags = rawTags.slice(0, 6)
  const hiddenTagCount = Math.max(0, rawTags.length - visibleTags.length)
  const statusWarning = /corriger|draft|brouillon/i.test(helpers.getStatus(document))
  const pdfLabel =
    isCurrentExportLoading && exportLoadingType === 'pdf'
      ? 'Préparation PDF...'
      : isCurrentExportLoading && exportLoadingType === 'source'
        ? 'Téléchargement...'
        : pdfAvailable
          ? 'Télécharger PDF'
          : helpers.canGeneratePdf(document)
            ? 'Générer PDF'
            : 'PDF indisponible'

  return (
    <BulkSelectableCard
      selected={selected}
      selectionMode={selectionMode}
      onToggleSelected={onToggleSelected}
    >
      <article className="library-document-card library-card bcvb-premium-card bcvb-card-safe">
        <header className="library-document-card__top">
          <div>
            <p className="bcvb-eyebrow bcvb-premium-card__eyebrow bcvb-tag-safe">
              {helpers.getFamily(document)}
            </p>
            <h2 className="library-document-card__title bcvb-premium-card__title bcvb-text-clamp-2">
              {helpers.getDocumentTitle(document)}
            </h2>
          </div>

          <span
            className={[
              'library-card__status',
              'bcvb-premium-status',
              'bcvb-status-safe',
              statusWarning
                ? 'is-warning bcvb-premium-status--warning'
                : 'is-ready bcvb-premium-status--ok',
            ].join(' ')}
          >
            {helpers.getStatus(document)}
          </span>
        </header>

        <p className="library-document-card__description library-card__description bcvb-premium-card__text bcvb-text-clamp-3">
          {helpers.getDocumentDescription(document)}
        </p>

        <div className="library-document-card__meta library-card__meta bcvb-scroll-row">
          <span className="bcvb-badge-safe">{helpers.getCategory(document)}</span>
          <span className="bcvb-badge-safe">{helpers.getSubCategory(document)}</span>
          <span className="bcvb-theme-chip-safe">{helpers.getTheme(document)}</span>
          <span className="bcvb-badge-safe">{helpers.getSportCategory(document)}</span>
          <span className="bcvb-badge-safe">{helpers.getAudience(document)}</span>
          <span className="bcvb-badge-safe">{helpers.getSeason(document)}</span>
          <span className="bcvb-badge-safe">{helpers.getFileType(document)}</span>
          <span className="bcvb-badge-safe">{helpers.getPublicationLevel(document)}</span>
        </div>

        <div className="library-document-card__tags library-card__tags bcvb-scroll-row">
          {visibleTags.map((tag) => (
            <span className="library-document-card__tag bcvb-tag-safe" key={tag}>
              {tag}
            </span>
          ))}
          {hiddenTagCount > 0 ? (
            <span className="library-card__tag-more bcvb-tag-safe">+{hiddenTagCount}</span>
          ) : null}
        </div>

        <div className="library-card__version bcvb-scroll-row">
          <span className="bcvb-badge-safe">
            Version actuelle {helpers.getVersion(document)}
          </span>
          <span className="bcvb-badge-safe">
            Modifié le {helpers.getSafeDateLabel(document.updated_at || document.created_at)}
          </span>

          {helpers.hasVersions(document) ? (
            <button type="button" onClick={onShowVersions}>
              Voir versions
            </button>
          ) : (
            <span className="library-card__version-note bcvb-badge-safe">
              Versions à venir
            </span>
          )}
        </div>

        <div className="library-document-card__actions library-card__actions">
          <div className="library-card__action-group library-card__action-group--primary document-action-row bcvb-action-row-safe">
            <button
              type="button"
              className="document-action-button document-action-button--primary"
              onClick={onOpen}
              disabled={openingId === document.id}
            >
              {openingId === document.id ? 'Ouverture...' : 'Ouvrir'}
            </button>

            <button
              type="button"
              className="document-action-button document-action-button--ghost"
              onClick={onPreview}
            >
              Prévisualiser
            </button>
          </div>

          <div className="library-card__action-group document-action-row bcvb-action-row-safe">
            <button
              type="button"
              className={[
                'document-action-button',
                pdfAvailable
                  ? 'document-action-button--ghost'
                  : 'document-action-button--primary',
                isCurrentExportLoading ? 'document-action-button--loading' : '',
              ].filter(Boolean).join(' ')}
              onClick={onGeneratePdf}
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
              onClick={onDownloadSource}
              disabled={!sourceAvailable || isCurrentExportLoading}
              title={!sourceAvailable ? 'Source indisponible.' : undefined}
            >
              {isCurrentExportLoading && exportLoadingType === 'source'
                ? 'Téléchargement...'
                : sourceAvailable
                  ? 'Télécharger source'
                  : 'Source indisponible'}
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
              onClick={onDownloadMarkdown}
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
                onClick={onTransform}
                disabled={!sourceAvailable}
                title={!sourceAvailable ? 'Transformation impossible : source indisponible.' : undefined}
              >
                Transformer BCVB
              </button>
            ) : (
              <span className="library-card__hint bcvb-badge-safe">
                Transformation réservée admin.
              </span>
            )}
          </div>

          {isAdminRole ? (
            <div className="library-card__action-group library-card__action-group--admin document-action-row bcvb-action-row-safe">
              <button
                type="button"
                className="document-action-button document-action-button--ghost"
                onClick={onArchive}
                disabled={
                  adminActionId === document.id ||
                  helpers.isArchived(document) ||
                  helpers.isDeleted(document)
                }
              >
                {helpers.isArchived(document) ? 'Archivé' : 'Archiver'}
              </button>

              <button
                type="button"
                className="document-action-button document-action-button--danger library-card__danger"
                onClick={onSoftDelete}
                disabled={adminActionId === document.id || helpers.isDeleted(document)}
              >
                {helpers.isDeleted(document) ? 'Supprimé' : 'Supprimer'}
              </button>
            </div>
          ) : null}
        </div>
      </article>
    </BulkSelectableCard>
  )
}
