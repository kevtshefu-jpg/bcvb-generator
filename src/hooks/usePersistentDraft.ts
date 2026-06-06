import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

type PersistentDraftState<T> = {
  draft: T
  setDraft: Dispatch<SetStateAction<T>>
  resetDraft: () => void
  restored: boolean
  dirty: boolean
  markSaved: () => void
}

function readDraft<T>(key: string, initialValue: T) {
  if (typeof window === 'undefined') return { value: initialValue, restored: false }

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return { value: initialValue, restored: false }
    return { value: JSON.parse(raw) as T, restored: true }
  } catch {
    return { value: initialValue, restored: false }
  }
}

export function usePersistentDraft<T>(key: string, initialValue: T): PersistentDraftState<T> {
  const initial = useMemo(() => readDraft(key, initialValue), [key])
  const [draft, setDraft] = useState<T>(initial.value)
  const [restored, setRestored] = useState(initial.restored)
  const [dirty, setDirty] = useState(initial.restored)
  const firstWrite = useRef(true)

  useEffect(() => {
    if (firstWrite.current) {
      firstWrite.current = false
      return
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(draft))
      setDirty(true)
    } catch {
      // Le brouillon ne doit jamais casser l'édition si le stockage local est indisponible.
    }
  }, [draft, key])

  useEffect(() => {
    if (!dirty) return undefined

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [dirty])

  const resetDraft = useCallback(() => {
    window.localStorage.removeItem(key)
    setDraft(initialValue)
    setDirty(false)
    setRestored(false)
    firstWrite.current = true
  }, [initialValue, key])

  const markSaved = useCallback(() => {
    setDirty(false)
    setRestored(false)
  }, [])

  return { draft, setDraft, resetDraft, restored, dirty, markSaved }
}
