import { BCVBRichDocumentRenderer } from '../../documents/components/BCVBRichDocumentRenderer'
import type { LibraryDocumentRow } from '../services/libraryService'

type DocumentPreviewModalProps = {
  document: LibraryDocumentRow | null
  canTransform: boolean
  onClose: () => void
  onOpen: (document: LibraryDocumentRow) => void
  onDownloadPdf: (document: LibraryDocumentRow) => void
  onDownloadSource: (document: LibraryDocumentRow) => void
  onTransform: (document: LibraryDocumentRow) => void
  onCopySource: (document: LibraryDocumentRow) => void
  exportLoadingId?: string | null
  exportLoadingType?: 'pdf' | 'source' | 'markdown' | null
}

function getDocumentFamily(document: LibraryDocumentRow) {
  return document.family || document.subcategory || document.category || document.document_type || 'Document BCVB'
}

function getQualityStatus(document: LibraryDocumentRow) {
  return document.quality_status || document.status || 'À contrôler'
}

function getPreviewKind(document: LibraryDocumentRow) {
  const extension = (document.file_ext || document.document_type || '').toLowerCase()
  if (document.content?.trim() || document.source_markdown?.trim()) return 'rich'
  if (extension.includes('pdf')) return 'pdf'
  if (extension.includes('image') || ['jpg', 'jpeg', 'png', 'webp'].includes(extension)) return 'image'
  if (extension.includes('doc') || extension.includes('text') || extension.includes('md')) return 'source'
  return 'scan'
}

function formatAudience(value: LibraryDocumentRow['audience']) {
  return Array.isArray(value) ? value.join(', ') : value || 'Audience non renseignée'
}

function canDownloadPdf(document: LibraryDocumentRow) {
  return Boolean(
    document.pdf_url ||
      document.pdf_storage_path ||
      document.pdfPath ||
      document.pdf_path ||
      document.content?.trim() ||
      document.source_markdown?.trim(),
  )
}

function canDownloadSource(document: LibraryDocumentRow) {
  return Boolean(
    document.content?.trim() ||
      document.source_markdown?.trim() ||
      document.file_url ||
      document.storage_path ||
      document.sourcePath ||
      document.source_path ||
      document.sourceDownloadUrl ||
      document.source_download_url,
  )
}

export function DocumentPreviewModal({
  document,
  canTransform,
  onClose,
  onOpen,
  onDownloadPdf,
  onDownloadSource,
  onTransform,
  onCopySource,
  exportLoadingId = null,
  exportLoadingType = null,
}: DocumentPreviewModalProps) {
  if (!document) return null

  const tags = document.tags || []
  const visibleTags = tags.slice(0, 6)
  const hiddenTagCount = Math.max(0, tags.length - visibleTags.length)
  const previewKind = getPreviewKind(document)
  const pdfAvailable = canDownloadPdf(document)
  const sourceAvailable = canDownloadSource(document)
  const sourceText = document.content?.trim() || document.source_markdown?.trim()
  const isExportLoading = exportLoadingId === document.id

  return (
    <div className="library-preview-backdrop" role="presentation" onClick={onClose}>
      <section className="library-preview-modal bcvb-premium-card bcvb-card-safe" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <header className="library-preview-modal__header">
          <div>
            <p className="bcvb-eyebrow bcvb-premium-card__eyebrow bcvb-tag-safe">Prévisualisation</p>
            <h2 className="bcvb-premium-card__title bcvb-text-clamp-2">{document.title || 'Document BCVB'}</h2>
            <p className="bcvb-premium-card__text bcvb-text-clamp-3">{document.description || document.summary || 'Aucun résumé disponible.'}</p>
          </div>
          <button className="bcvb-premium-button bcvb-premium-button--ghost" type="button" onClick={onClose}>Fermer</button>
        </header>

        <div className="library-preview-modal__meta bcvb-premium-card__meta bcvb-scroll-row">
          <span className="bcvb-badge-safe">{getDocumentFamily(document)}</span>
          <span className="bcvb-badge-safe">{document.category_code || document.category || 'Catégorie non renseignée'}</span>
          <span className="bcvb-badge-safe">{document.subCategory || document.sub_category || document.subcategory || 'Sous-catégorie non renseignée'}</span>
          <span className="bcvb-theme-chip-safe">{document.theme || document.theme_code || 'Thème non renseigné'}</span>
          <span className="bcvb-badge-safe">{document.sportCategory || document.sport_category || document.team_code || 'Catégorie sportive non renseignée'}</span>
          <span className="bcvb-badge-safe">{formatAudience(document.audience)}</span>
          <span className="bcvb-badge-safe">{document.season || 'Saison non renseignée'}</span>
          <span className="bcvb-status-safe">{getQualityStatus(document)}</span>
        </div>

        {tags.length > 0 && (
          <div className="library-card__tags bcvb-scroll-row">
            {visibleTags.map((tag) => <span className="bcvb-tag-safe" key={tag}>{tag}</span>)}
            {hiddenTagCount > 0 ? <span className="library-card__tag-more bcvb-tag-safe">+{hiddenTagCount}</span> : null}
          </div>
        )}

        <div className={`library-preview-modal__content library-preview-modal__content--${previewKind}`}>
          {previewKind === 'rich' && sourceText ? (
            <BCVBRichDocumentRenderer content={sourceText} document={document} />
          ) : (
            <article>
              <h3>{previewKind === 'pdf' ? 'Aperçu PDF' : previewKind === 'image' ? 'Aperçu image' : previewKind === 'scan' ? 'Document scanné / OCR' : 'Source texte'}</h3>
              <p>
                {previewKind === 'pdf' && 'Le fichier PDF est disponible via l’ouverture ou le téléchargement.'}
                {previewKind === 'image' && 'Le document est une image ou une pièce jointe visuelle.'}
                {previewKind === 'scan' && 'Le document nécessite une extraction OCR ou une transformation depuis le Studio éditorial.'}
                {previewKind === 'source' && 'La source texte ou bureautique peut être ouverte ou transformée.'}
              </p>
              {document.summary && <p>{document.summary}</p>}
            </article>
          )}
        </div>

        <footer className="library-preview-modal__actions bcvb-premium-actions bcvb-action-row-safe">
          <button className="bcvb-premium-button bcvb-premium-button--primary" type="button" onClick={() => onOpen(document)}>Ouvrir</button>
          <button
            className="bcvb-premium-button bcvb-premium-button--ghost"
            type="button"
            onClick={() => onDownloadPdf(document)}
            disabled={!pdfAvailable || isExportLoading}
            title={!pdfAvailable ? 'PDF impossible : aucune source exploitable.' : undefined}
          >
            {isExportLoading && exportLoadingType === 'pdf'
              ? 'Préparation PDF...'
              : pdfAvailable ? 'Télécharger PDF' : 'PDF indisponible'}
          </button>
          <button
            className="bcvb-premium-button bcvb-premium-button--ghost"
            type="button"
            onClick={() => onDownloadSource(document)}
            disabled={!sourceAvailable || isExportLoading}
            title={!sourceAvailable ? 'Source indisponible.' : undefined}
          >
            {isExportLoading && exportLoadingType === 'source'
              ? 'Téléchargement...'
              : sourceAvailable ? 'Télécharger source' : 'Source indisponible'}
          </button>
          <button className="bcvb-premium-button bcvb-premium-button--ghost" type="button" onClick={() => onCopySource(document)} disabled={!sourceText} title={!sourceText ? 'Source Markdown indisponible.' : undefined}>
            Copier source
          </button>
          {canTransform && (
            <button className="bcvb-premium-button bcvb-premium-button--secondary" type="button" onClick={() => onTransform(document)}>
              Transformer en document BCVB
            </button>
          )}
        </footer>
      </section>
    </div>
  )
}
