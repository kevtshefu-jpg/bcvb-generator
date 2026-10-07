export type SafetyState = 'vert' | 'orange' | 'rouge'

export type SafetyDecisionInput = {
  pain: number | null
  unusualPain?: boolean
  instability?: boolean
  recentTrauma?: boolean
  worseningSymptoms?: boolean
  sessionRpe?: number | null
  targetRpeMax?: number | null
  previousHardSession?: boolean
  plannedHardSession?: boolean
}

export type SafetyDecision = {
  state: SafetyState
  action: 'normal' | 'adapter' | 'arreter'
  reasons: string[]
  professionalAdvice: boolean
}

export function evaluateSafetyDecision(input: SafetyDecisionInput): SafetyDecision {
  const urgentReasons: string[] = []
  if (input.unusualPain) urgentReasons.push('douleur inhabituelle')
  if (input.instability) urgentReasons.push('instabilité')
  if (input.recentTrauma) urgentReasons.push('traumatisme récent')
  if (input.worseningSymptoms) urgentReasons.push('aggravation des symptômes')
  if (urgentReasons.length) return { state: 'rouge', action: 'arreter', reasons: urgentReasons, professionalAdvice: true }

  const adaptReasons: string[] = []
  if (input.pain !== null && input.pain > 4) adaptReasons.push('douleur supérieure au seuil prudent 4/10')
  else if (input.pain !== null && input.pain > 3) adaptReasons.push('douleur supérieure à 3/10')
  if (input.sessionRpe != null && input.targetRpeMax != null && input.sessionRpe > input.targetRpeMax) adaptReasons.push('RPE supérieur à la cible')
  if (input.previousHardSession && input.plannedHardSession) adaptReasons.push('deux séances très dures consécutives à éviter')
  if (adaptReasons.length) return { state: 'orange', action: 'adapter', reasons: adaptReasons, professionalAdvice: input.pain !== null && input.pain > 4 }

  return { state: 'vert', action: 'normal', reasons: [], professionalAdvice: false }
}
