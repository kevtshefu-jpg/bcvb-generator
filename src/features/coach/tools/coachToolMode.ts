export type CoachToolMode = 'novice' | 'expert'

export const COACH_TOOL_MODE_STORAGE_KEY = 'bcvb.coach.toolMode'

export function getInitialCoachToolMode(): CoachToolMode {
  if (typeof window === 'undefined') return 'novice'

  try {
    return window.localStorage.getItem(COACH_TOOL_MODE_STORAGE_KEY) === 'expert'
      ? 'expert'
      : 'novice'
  } catch {
    return 'novice'
  }
}

export function getNextCoachToolMode(mode: CoachToolMode): CoachToolMode {
  return mode === 'novice' ? 'expert' : 'novice'
}
