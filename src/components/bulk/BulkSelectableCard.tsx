import type { ReactNode } from 'react'
import './bulk-actions.css'

type BulkSelectableCardProps = {
  selected: boolean
  selectionMode: boolean
  onToggleSelected: () => void
  children: ReactNode
}

export default function BulkSelectableCard({
  selected,
  selectionMode,
  onToggleSelected,
  children,
}: BulkSelectableCardProps) {
  return (
    <div className={`bulk-selectable-card${selected ? ' is-selected' : ''}`}>
      {selectionMode ? (
        <label className="bulk-selectable-card__checkbox" onClick={(event) => event.stopPropagation()}>
          <input type="checkbox" checked={selected} onChange={onToggleSelected} />
          <span>{selected ? 'Sélectionné' : 'Sélectionner'}</span>
        </label>
      ) : null}

      {children}
    </div>
  )
}
