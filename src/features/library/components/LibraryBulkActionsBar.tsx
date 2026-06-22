import { BulkSelectionToolbar } from '../../../components/bulk'

type LibraryBulkActionsBarProps = {
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onClear: () => void
  onArchiveSelected?: () => void
  onDeleteSelected?: () => void
  onCancel: () => void
  isDeleting?: boolean
}

export default function LibraryBulkActionsBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClear,
  onArchiveSelected,
  onDeleteSelected,
  onCancel,
  isDeleting = false,
}: LibraryBulkActionsBarProps) {
  return (
    <BulkSelectionToolbar
      selectedCount={selectedCount}
      totalCount={totalCount}
      onSelectAll={onSelectAll}
      onClear={onClear}
      onArchiveSelected={onArchiveSelected}
      onDeleteSelected={onDeleteSelected}
      onCancel={onCancel}
      archiveLabel="Archiver sélection"
      deleteLabel="Supprimer sélection"
      isDeleting={isDeleting}
    />
  )
}
