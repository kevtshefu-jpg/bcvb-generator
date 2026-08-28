import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ExperienceMode = 'guided' | 'compact'
export type TextSize = 'standard' | 'large'

type ExperienceContextValue = {
  mode: ExperienceMode
  textSize: TextSize
  setMode: (mode: ExperienceMode) => void
  setTextSize: (size: TextSize) => void
}

const STORAGE_KEY = 'bcvb.experience.preferences'
const COACH_MODE_STORAGE_KEY = 'bcvb.coach.toolMode'

const ExperienceContext = createContext<ExperienceContextValue | null>(null)

function getInitialPreferences(): Pick<ExperienceContextValue, 'mode' | 'textSize'> {
  if (typeof window === 'undefined') return { mode: 'guided', textSize: 'standard' }

  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')
    return {
      mode: stored.mode === 'compact' ? 'compact' : 'guided',
      textSize: stored.textSize === 'large' ? 'large' : 'standard',
    }
  } catch {
    return { mode: 'guided', textSize: 'standard' }
  }
}

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(getInitialPreferences, [])
  const [mode, setMode] = useState<ExperienceMode>(initial.mode)
  const [textSize, setTextSize] = useState<TextSize>(initial.textSize)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, textSize }))
      window.localStorage.setItem(COACH_MODE_STORAGE_KEY, mode === 'compact' ? 'expert' : 'novice')
      window.dispatchEvent(new CustomEvent('bcvb:coach-tool-mode', {
        detail: mode === 'compact' ? 'expert' : 'novice',
      }))
    } catch {
      // Le site reste utilisable si le stockage est désactivé.
    }
  }, [mode, textSize])

  return (
    <ExperienceContext.Provider value={{ mode, textSize, setMode, setTextSize }}>
      {children}
    </ExperienceContext.Provider>
  )
}

export function useExperience() {
  const context = useContext(ExperienceContext)
  if (!context) throw new Error('useExperience doit être utilisé dans ExperienceProvider')
  return context
}
