import type { LibraryDocumentRow } from '../services/libraryService'
import LibraryDocumentCard, {
  type LibraryDocumentCardHelpers,
} from './LibraryDocumentCard'

type ExportLoadingType = 'pdf' | 'source' | 'markdown' | null

type LibraryDocumentGridProps = {
  documents: LibraryDocumentRow[]
  viewMode: 'grid' | 'list'
  selectionMode: boolean
  isAdminRole: boolean
  transformAllowed: boolean
  openingId: string | null
  adminActionId: string | null
  exportLoadingId: string | null
  exportLoadingType: ExportLoadingType
  helpers: LibraryDocumentCardHelpers
  isSelected: (documentId: string) => boolean
  onToggleSelected: (documentId: string) => void
  onPreview: (document: LibraryDocumentRow) => void
  onOpen: (document: LibraryDocumentRow) => void
  onGeneratePdf: (document: LibraryDocumentRow) => void
  onDownloadSource: (document: LibraryDocumentRow) => void
  onDownloadMarkdown: (document: LibraryDocumentRow) => void
  onTransform: (document: LibraryDocumentRow) => void
  onShowVersions: (document: LibraryDocumentRow) => void
  onArchive: (document: LibraryDocumentRow) => void
  onSoftDelete: (document: LibraryDocumentRow) => void
}

export default function LibraryDocumentGrid({
  documents,
  viewMode,
  selectionMode,
  isAdminRole,
  transformAllowed,
  openingId,
  adminActionId,
  exportLoadingId,
  exportLoadingType,
  helpers,
  isSelected,
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
}: LibraryDocumentGridProps) {
  return (
    <div className={`library-documents library-documents--${viewMode} bcvb-grid-safe`}>
      {documents.map((document) => (
        <LibraryDocumentCard
          key={document.id}
          document={document}
          selected={isSelected(document.id)}
          selectionMode={selectionMode && isAdminRole}
          isAdminRole={isAdminRole}
          transformAllowed={transformAllowed}
          openingId={openingId}
          adminActionId={adminActionId}
          exportLoadingId={exportLoadingId}
          exportLoadingType={exportLoadingType}
          helpers={helpers}
          onToggleSelected={() => onToggleSelected(document.id)}
          onPreview={() => onPreview(document)}
          onOpen={() => onOpen(document)}
          onGeneratePdf={() => onGeneratePdf(document)}
          onDownloadSource={() => onDownloadSource(document)}
          onDownloadMarkdown={() => onDownloadMarkdown(document)}
          onTransform={() => onTransform(document)}
          onShowVersions={() => onShowVersions(document)}
          onArchive={() => onArchive(document)}
          onSoftDelete={() => onSoftDelete(document)}
        />
      ))}
    </div>
  )
}
