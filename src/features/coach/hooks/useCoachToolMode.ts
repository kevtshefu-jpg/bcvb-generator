import { useCallback, useEffect, useState } from 'react'
import {
  COACH_TOOL_MODE_STORAGE_KEY,
  getInitialCoachToolMode,
  getNextCoachToolMode,
  type CoachToolMode,
} from '../tools/coachToolMode'

export function useCoachToolMode() {
  const [mode, setModeState] = useState<CoachToolMode>(() => getInitialCoachToolMode())

  const setMode = useCallback((nextMode: CoachToolMode) => {
    setModeState(nextMode)
  }, [])

  const toggleMode = useCallback(() => {
    setModeState((currentMode) => getNextCoachToolMode(currentMode))
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem(COACH_TOOL_MODE_STORAGE_KEY, mode)
    } catch {
      // localStorage peut être indisponible en navigation privée stricte.
    }
  }, [mode])

  useEffect(() => {
    function handleGlobalMode(event: Event) {
      const nextMode = (event as CustomEvent<CoachToolMode>).detail
      if (nextMode === 'novice' || nextMode === 'expert') setModeState(nextMode)
    }

    window.addEventListener('bcvb:coach-tool-mode', handleGlobalMode)
    return () => window.removeEventListener('bcvb:coach-tool-mode', handleGlobalMode)
  }, [])

  return {
    mode,
    isNovice: mode === 'novice',
    isExpert: mode === 'expert',
    setMode,
    toggleMode,
  }
}
