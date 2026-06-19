import { useCallback, useEffect, useMemo, useState } from 'react'

type BulkSelectableItem = {
  id: string
}

export function useBulkSelection<TItem extends BulkSelectableItem>(items: TItem[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [selectionMode, setSelectionMode] = useState(false)

  const itemIds = useMemo(() => items.map((item) => item.id), [items])

  useEffect(() => {
    setSelectedIds((current) => {
      if (current.size === 0) return current

      const allowedIds = new Set(itemIds)
      const next = new Set(Array.from(current).filter((id) => allowedIds.has(id)))

      return next.size === current.size ? current : next
    })
  }, [itemIds])

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds])

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)

      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }

      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(itemIds))
    if (itemIds.length > 0) setSelectionMode(true)
  }, [itemIds])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const enableSelectionMode = useCallback(() => setSelectionMode(true), [])

  const disableSelectionMode = useCallback(() => {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }, [])

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode((current) => {
      if (current) {
        setSelectedIds(new Set())
      }

      return !current
    })
  }, [])

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    isSelected,
    toggleSelected,
    selectAll,
    clearSelection,
    hasSelection: selectedIds.size > 0,
    selectionMode,
    enableSelectionMode,
    disableSelectionMode,
    toggleSelectionMode,
  }
}
