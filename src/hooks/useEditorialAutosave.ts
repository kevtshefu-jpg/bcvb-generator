import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clearEditorialDraft,
  type EditorialDraftState,
  loadEditorialDraft,
  saveEditorialDraft,
} from '../utils/editorialDraftStorage'

export function useEditorialAutosave(initialState: Partial<EditorialDraftState>) {
  const [draft, setDraft] = useState<EditorialDraftState | null>(() => {
    const saved = loadEditorialDraft()
    if (saved) return saved

    return saveEditorialDraft({
      activeStep: 'cadre',
      ...initialState,
    })
  })

  const saveTimer = useRef<number | null>(null)

  const updateDraft = useCallback((patch: Partial<EditorialDraftState>) => {
    setDraft((current) => {
      const next = {
        ...(current || {}),
        ...patch,
        updatedAt: new Date().toISOString(),
      } as EditorialDraftState

      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current)
      }

      saveTimer.current = window.setTimeout(() => {
        saveEditorialDraft(next)
      }, 250)

      return next
    })
  }, [])

  const forceSave = useCallback(() => {
    setDraft((current) => {
      if (current) saveEditorialDraft(current)
      return current
    })
  }, [])

  const resetDraft = useCallback(() => {
    clearEditorialDraft()
    const fresh = saveEditorialDraft({
      activeStep: 'cadre',
      ...initialState,
    })
    setDraft(fresh)
  }, [initialState])

  useEffect(() => {
    const saveBeforeLeave = () => {
      setDraft((current) => {
        if (current) saveEditorialDraft(current)
        return current
      })
    }

    window.addEventListener('beforeunload', saveBeforeLeave)
    document.addEventListener('visibilitychange', saveBeforeLeave)

    return () => {
      window.removeEventListener('beforeunload', saveBeforeLeave)
      document.removeEventListener('visibilitychange', saveBeforeLeave)
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
    }
  }, [])

  return {
    draft,
    updateDraft,
    forceSave,
    resetDraft,
  }
}
