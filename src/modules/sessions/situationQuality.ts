import type { SessionSituation } from './sessionModels'
import { hasBcvbLink } from './sessionUtils'

export type SituationQualityReport = {
  score: number
  status: 'à compléter' | 'coach-ready' | 'référence'
  warnings: string[]
  actions: string[]
}

function add(condition: boolean, points: number, warning: string, warnings: string[], actions: string[]) {
  if (condition) return points
  warnings.push(warning)
  actions.push(warning)
  return 0
}

export function analyzeSituationQuality(situation: SessionSituation): SituationQualityReport {
  const warnings: string[] = []
  const actions: string[] = []
  let score = 0

  score += add(Boolean(situation.title && situation.theme), 8, 'Titre ou thème manquant.', warnings, actions)
  score += add(Boolean(situation.objective && situation.objective.length > 18), 10, 'Objectif trop vague.', warnings, actions)
  score += add(Boolean(situation.organization && situation.space && situation.playerCount), 12, 'Organisation insuffisante.', warnings, actions)
  score += add(Boolean(situation.description && situation.description.length > 28), 10, 'Description insuffisante.', warnings, actions)
  score += add(Boolean(situation.instructions && situation.coachCues.length > 0), 10, 'Consignes joueurs ou coach manquantes.', warnings, actions)
  score += add(Boolean(situation.evolution), 8, 'Pas d’évolution.', warnings, actions)
  score += add(Boolean(situation.regression), 8, 'Pas de régression.', warnings, actions)
  score += add(situation.observableCriteria.length > 0, 10, 'Critères observables absents.', warnings, actions)
  score += add(situation.measurableCriteria.length > 0 || situation.metrics.length > 0, 10, 'Critères non quantifiables.', warnings, actions)
  score += add(hasBcvbLink(situation.bcvbLinks), 8, 'Lien BCVB absent.', warnings, actions)
  score += add(situation.courtFrames.length > 0, 6, 'Terrain incomplet.', warnings, actions)

  const boundedScore = Math.min(100, score)
  const status = boundedScore >= 88 ? 'référence' : boundedScore >= 72 ? 'coach-ready' : 'à compléter'

  return { score: boundedScore, status, warnings, actions }
}
