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
}

function getDocumentFamily(document: LibraryDocumentRow) {
  return document.family || document.subcategory || document.category || document.document_type || 'Document BCVB'
}

function getQualityStatus(document: LibraryDocumentRow) {
  return document.quality_status || document.status || 'À contrôler'
}

function getPreviewKind(document: LibraryDocumentRow) {
  const extension = (document.file_ext || document.document_type || '').toLowerCase()
  if (document.content?.trim()) return 'rich'
  if (extension.includes('pdf')) return 'pdf'
  if (extension.includes('image') || ['jpg', 'jpeg', 'png', 'webp'].includes(extension)) return 'image'
  if (extension.includes('doc') || extension.includes('text') || extension.includes('md')) return 'source'
  return 'scan'
}

function formatAudience(value: LibraryDocumentRow['audience']) {
  return Array.isArray(value) ? value.join(', ') : value || 'Audience non renseignée'
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
}: DocumentPreviewModalProps) {
  if (!document) return null

  const tags = document.tags || []
  const previewKind = getPreviewKind(document)

  return (
    <div className="library-preview-backdrop" role="presentation" onClick={onClose}>
      <section className="library-preview-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <header className="library-preview-modal__header">
          <div>
            <p className="bcvb-eyebrow">Prévisualisation</p>
            <h2>{document.title || 'Document BCVB'}</h2>
            <p>{document.description || document.summary || 'Aucun résumé disponible.'}</p>
          </div>
          <button type="button" onClick={onClose}>Fermer</button>
        </header>

        <div className="library-preview-modal__meta">
          <span>{getDocumentFamily(document)}</span>
          <span>{document.category_code || document.category || 'Catégorie non renseignée'}</span>
          <span>{document.subCategory || document.sub_category || document.subcategory || 'Sous-catégorie non renseignée'}</span>
          <span>{document.theme || document.theme_code || 'Thème non renseigné'}</span>
          <span>{document.sportCategory || document.sport_category || document.team_code || 'Catégorie sportive non renseignée'}</span>
          <span>{formatAudience(document.audience)}</span>
          <span>{document.season || 'Saison non renseignée'}</span>
          <span>{getQualityStatus(document)}</span>
        </div>

        {tags.length > 0 && (
          <div className="library-card__tags">
            {tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        )}

        <div className={`library-preview-modal__content library-preview-modal__content--${previewKind}`}>
          {previewKind === 'rich' && document.content ? (
            <BCVBRichDocumentRenderer content={document.content} document={document} />
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

        <footer className="library-preview-modal__actions">
          <button type="button" onClick={() => onOpen(document)}>Ouvrir</button>
          <button type="button" onClick={() => onDownloadPdf(document)}>Télécharger PDF</button>
          <button type="button" onClick={() => onDownloadSource(document)}>Télécharger source</button>
          <button type="button" onClick={() => onCopySource(document)} disabled={!document.content?.trim()} title={!document.content?.trim() ? 'Source Markdown indisponible.' : undefined}>
            Copier source
          </button>
          {canTransform && (
            <button type="button" onClick={() => onTransform(document)}>
              Transformer en document BCVB
            </button>
          )}
        </footer>
      </section>
    </div>
  )
}
