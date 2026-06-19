import './bulk-actions.css'

type BulkSelectionToolbarProps = {
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onClear: () => void
  onDeleteSelected?: () => void
  onArchiveSelected?: () => void
  onCancel?: () => void
  deleteLabel?: string
  archiveLabel?: string
  isDeleting?: boolean
}

export default function BulkSelectionToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClear,
  onDeleteSelected,
  onArchiveSelected,
  onCancel,
  deleteLabel = 'Supprimer',
  archiveLabel = 'Archiver',
  isDeleting = false,
}: BulkSelectionToolbarProps) {
  return (
    <div className="bulk-selection-toolbar bcvb-premium-toolbar bcvb-toolbar-safe" role="region" aria-label="Actions groupées">
      <strong>
        {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
      </strong>

      <span>{totalCount} élément{totalCount > 1 ? 's' : ''} visible{totalCount > 1 ? 's' : ''}</span>

      <div className="bulk-selection-toolbar__actions bcvb-premium-toolbar__secondary bcvb-action-row-safe">
        <button className="bcvb-premium-button bcvb-premium-button--secondary" type="button" onClick={onSelectAll} disabled={totalCount === 0 || selectedCount === totalCount}>
          Tout sélectionner
        </button>

        <button className="bcvb-premium-button bcvb-premium-button--ghost" type="button" onClick={onClear} disabled={selectedCount === 0}>
          Vider
        </button>

        {onArchiveSelected ? (
          <button className="bcvb-premium-button bcvb-premium-button--ghost" type="button" onClick={onArchiveSelected} disabled={selectedCount === 0 || isDeleting}>
            {archiveLabel}
          </button>
        ) : null}

        {onDeleteSelected ? (
          <button
            type="button"
            className="bulk-selection-toolbar__danger bcvb-premium-button bcvb-premium-button--danger"
            onClick={onDeleteSelected}
            disabled={selectedCount === 0 || isDeleting}
          >
            {isDeleting ? 'Suppression...' : deleteLabel}
          </button>
        ) : null}

        <button className="bcvb-premium-button bcvb-premium-button--ghost" type="button" onClick={onCancel || onClear}>
          Annuler
        </button>
      </div>
    </div>
  )
}
