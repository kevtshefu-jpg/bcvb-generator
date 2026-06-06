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

export function reorderSituations(situations: SessionSituation[]) {
  return situations.map((situation, index) => ({ ...situation, order: index + 1 }))
}

export function duplicateSituation(situation: SessionSituation) {
  const { id, courtFrames, ...copy } = situation
  void id

  return createSituation({
    ...copy,
    title: `${situation.title} - copie`,
    order: situation.order + 1,
    courtFrames: courtFrames.map((frame, index) => ({
      ...frame,
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
