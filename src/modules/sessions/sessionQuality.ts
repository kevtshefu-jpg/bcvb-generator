import type { SessionSituation, TrainingSessionV2 } from './sessionModels'
import { getTotalSituationDuration, hasBcvbLink } from './sessionUtils'

export type SessionQualityReport = {
  score: number
  status: 'brouillon' | 'prêt terrain' | 'prêt PDF' | 'excellent'
  warnings: string[]
  missing: string[]
  actions: string[]
}

function complete(value?: string | null, minLength = 3) {
  return Boolean(value && value.trim().length >= minLength)
}

function allSituations(session: TrainingSessionV2, predicate: (situation: SessionSituation) => boolean) {
  return session.situations.length > 0 && session.situations.every(predicate)
}

function hasUsableCourt(situation: SessionSituation) {
  return situation.courtFrames.some((frame) => {
    const validMode = frame.courtType === 'full' || frame.courtType === 'half-left' || frame.courtType === 'half-right' || frame.courtType === 'half' || frame.courtType === 'half-offense' || frame.courtType === 'half-defense'
    return validMode && (frame.objects.length > 0 || frame.arrows.length > 0 || frame.zones.length > 0 || complete(frame.intent))
  })
}

function addCheck(condition: boolean, label: string, missing: string[], actions: string[]) {
  if (condition) return 10
  missing.push(label)
  actions.push(`Compléter : ${label}`)
  return 0
}

export function analyzeSessionQuality(session: TrainingSessionV2): SessionQualityReport {
  const missing: string[] = []
  const actions: string[] = []
  const warnings: string[] = []
  const totalDuration = getTotalSituationDuration(session)

  const checks = [
    addCheck(Boolean(complete(session.title) && session.category && session.durationMinutes > 0 && session.expectedPlayers > 0), 'infos générales complètes', missing, actions),
    addCheck(session.objectives.some((objective) => complete(objective, 8)), 'objectif de séance clair', missing, actions),
    addCheck(session.situations.length > 0 && Math.abs(totalDuration - session.durationMinutes) <= 12, 'déroulé cohérent', missing, actions),
    addCheck(allSituations(session, (situation) => situation.durationMinutes > 0), 'chaque situation a une durée', missing, actions),
    addCheck(allSituations(session, (situation) => complete(situation.objective, 8) && complete(situation.organization, 8)), 'chaque situation a objectif + organisation', missing, actions),
    addCheck(allSituations(session, (situation) => complete(situation.instructions, 8) && (situation.coachCues.length > 0 || complete(situation.coachingPoints, 8))), 'chaque situation a consignes + points coach', missing, actions),
    addCheck(allSituations(session, (situation) => complete(situation.evolution, 5) && complete(situation.regression, 5)), 'évolution et régression présentes', missing, actions),
    addCheck(allSituations(session, (situation) => situation.observableCriteria.length > 0), 'critères observables présents', missing, actions),
    addCheck(allSituations(session, (situation) => situation.measurableCriteria.length > 0 || situation.metrics.length > 0), 'critères quantifiables présents', missing, actions),
    addCheck(allSituations(session, hasUsableCourt), 'terrain exploitable avec au moins 1 frame par situation', missing, actions),
  ]

  const score = checks.reduce((sum, value) => sum + value, 0)

  if (totalDuration > session.durationMinutes + 12) warnings.push('Le déroulé dépasse fortement la durée prévue.')
  if (totalDuration < session.durationMinutes - 20) warnings.push('La séance semble trop courte par rapport à la durée prévue.')
  if (session.situations.length === 0) warnings.push('Aucune situation pédagogique n’est créée.')

  session.situations.forEach((situation) => {
    const prefix = `Situation ${situation.order} - ${situation.title || 'sans titre'}`
    if (!complete(situation.objective, 8)) warnings.push(`${prefix} : objectif manquant ou trop court.`)
    if (!complete(situation.organization, 8)) warnings.push(`${prefix} : organisation manquante.`)
    if (!complete(situation.instructions, 8)) warnings.push(`${prefix} : consignes joueurs manquantes.`)
    if (!situation.coachCues.length && !complete(situation.coachingPoints, 8)) warnings.push(`${prefix} : points coach manquants.`)
    if (!complete(situation.evolution, 5)) warnings.push(`${prefix} : évolution manquante.`)
    if (!complete(situation.regression, 5)) warnings.push(`${prefix} : régression manquante.`)
    if (!situation.observableCriteria.length) warnings.push(`${prefix} : critères observables manquants.`)
    if (!situation.measurableCriteria.length && !situation.metrics.length) warnings.push(`${prefix} : critères quantifiables manquants.`)
    if (!hasBcvbLink(situation.bcvbLinks)) warnings.push(`${prefix} : lien BCVB manquant.`)
    if (!hasUsableCourt(situation)) warnings.push(`${prefix} : Terrain non exploitable : reconstruire le schéma.`)
  })

  const status = score >= 90 ? 'excellent' : score >= 80 ? 'prêt PDF' : score >= 70 ? 'prêt terrain' : 'brouillon'

  return {
    score,
    status,
    warnings,
    missing,
    actions,
  }
}
