import { createSituation, type BcvbIdentityLinks, type SessionSituation, type TrainingSessionV2 } from './sessionModels'

export function listToText(items?: string[]) {
  return (items || []).join(', ')
}

export function textToList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

export function getTotalSituationDuration(session: TrainingSessionV2) {
  return session.situations.reduce((sum, situation) => sum + Number(situation.durationMinutes || 0), 0)
}

export type SessionDurationValidation = {
  announcedMinutes: number
  calculatedMinutes: number
  differenceMinutes: number
  valid: boolean
}

export function validateSessionDuration(session: TrainingSessionV2): SessionDurationValidation {
  const announcedMinutes = Number(session.durationMinutes || 0)
  const calculatedMinutes = getTotalSituationDuration(session)

  return {
    announcedMinutes,
    calculatedMinutes,
    differenceMinutes: calculatedMinutes - announcedMinutes,
    // Match the server transition gate: at least one block and strictly positive minute counts.
    // Non-integer and non-finite values cannot be persisted as database minutes.
    valid: Number.isSafeInteger(announcedMinutes) && announcedMinutes > 0
      && session.situations.length > 0
      && session.situations.every((situation) => Number.isSafeInteger(situation.durationMinutes) && situation.durationMinutes > 0)
      && announcedMinutes === calculatedMinutes,
  }
}


/**
 * One human-readable source for duration failures across editor, template picker,
 * coach preview and exports. An equal sum is not sufficient when a block is invalid.
 */
export function getSessionDurationProblem(session: TrainingSessionV2): string | null {
  const duration = validateSessionDuration(session)
  if (!Number.isSafeInteger(duration.announcedMinutes) || duration.announcedMinutes <= 0) {
    return 'La durée annoncée doit être un nombre entier de minutes strictement positif.'
  }
  if (session.situations.length === 0) {
    return 'Aucune situation planifiée : ajoutez au moins un bloc avant utilisation.'
  }
  if (session.situations.some((situation) => !Number.isSafeInteger(situation.durationMinutes) || situation.durationMinutes <= 0)) {
    return 'Chaque situation doit durer un nombre entier de minutes strictement positif.'
  }
  if (duration.differenceMinutes < 0) {
    return `${Math.abs(duration.differenceMinutes)} min non planifiées (Déroulé : ${duration.calculatedMinutes} min).`
  }
  if (duration.differenceMinutes > 0) {
    return `${duration.differenceMinutes} min au-delà de la durée annoncée (Déroulé : ${duration.calculatedMinutes} min).`
  }
  return null
}

export function reorderSituations(situations: SessionSituation[]) {
  return situations.map((situation, index) => ({ ...situation, order: index + 1 }))
}

export function duplicateSituation(situation: SessionSituation) {
  const { id, courtFrames, ...copy } = situation
  void id

  return createSituation({
    ...structuredClone(copy),
    title: `${situation.title} - copie`,
    order: (situation.order ?? 0) + 1,
    courtFrames: courtFrames.map((frame, index) => ({
      ...frame,
      objects: structuredClone(frame.objects),
      arrows: structuredClone(frame.arrows),
      zones: structuredClone(frame.zones),
      id: '',
      title: index === 0 ? `${frame.title} - copie` : frame.title,
    })),
  })
}

export function getPhaseLabel(phase: string) {
  if (phase === 'je-decouvre') return 'Je découvre'
  if (phase === 'je-m-exerce') return 'Je m’exerce'
  if (phase === 'je-retranscris') return 'Je retranscris en match'
  if (phase === 'je-regule') return 'Je régule'
  return phase
}

export const BCVB_TAGS = [
  'Défendre Fort',
  'Courir',
  'Partager la Balle',
  'Homme à Homme',
  'Intensité',
  'Agressivité maîtrisée',
  'Maîtrise',
  'Jeu',
]

const bcvbLabels: Array<[keyof BcvbIdentityLinks, string]> = [
  ['defendreFort', 'Défendre Fort'],
  ['courir', 'Courir'],
  ['partager', 'Partager la Balle'],
  ['hommeHomme', 'Homme à Homme'],
  ['intensite', 'Intensité'],
  ['agressiviteMaitrisee', 'Agressivité maîtrisée'],
  ['maitrise', 'Maîtrise'],
  ['jeu', 'Jeu'],
]

export function bcvbLinksToText(links: BcvbIdentityLinks) {
  return bcvbLabels
    .map(([key, label]) => links[key] ? `${label}: ${links[key]}` : '')
    .filter(Boolean)
    .join('\n')
}

export function patchBcvbLink(links: BcvbIdentityLinks, key: keyof BcvbIdentityLinks, value: string) {
  return { ...links, [key]: value }
}

export function hasBcvbLink(links: BcvbIdentityLinks) {
  return Object.values(links).some(Boolean)
}
