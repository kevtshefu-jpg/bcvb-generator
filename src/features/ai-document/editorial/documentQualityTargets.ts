export const QUALITY_TARGETS = {
  cahier_technique: {
    minScore: 90,
    minTables: 8,
    minSituations: 12,
    minDiagrams: 12,
    minBcvbBlocks: 25,
  },
  guide_coach: {
    minScore: 90,
    minTables: 6,
    minSituations: 6,
    minDiagrams: 6,
    minBcvbBlocks: 20,
  },
  plan_formation: {
    minScore: 92,
    minTables: 10,
    minSituations: 0,
    minDiagrams: 4,
    minBcvbBlocks: 20,
  },
  ruban_pedagogique: {
    minScore: 90,
    minTables: 4,
    minSituations: 0,
    minDiagrams: 0,
    minBcvbBlocks: 10,
  },
  seance_entrainement: {
    minScore: 88,
    minTables: 2,
    minSituations: 1,
    minDiagrams: 1,
    minBcvbBlocks: 8,
  },
  fiche_theme: {
    minScore: 88,
    minTables: 3,
    minSituations: 3,
    minDiagrams: 3,
    minBcvbBlocks: 10,
  },
} as const

export type QualityTargetKey = keyof typeof QUALITY_TARGETS

export function resolveQualityTargetKey(family: string): QualityTargetKey {
  const normalized = family
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (/cahier|technical/.test(normalized)) return 'cahier_technique'
  if (/guide|coach/.test(normalized)) return 'guide_coach'
  if (/formation|plan/.test(normalized)) return 'plan_formation'
  if (/ruban|ribbon/.test(normalized)) return 'ruban_pedagogique'
  if (/seance|session|entrainement/.test(normalized)) return 'seance_entrainement'
  return 'fiche_theme'
}

export function getQualityTarget(family: string) {
  return QUALITY_TARGETS[resolveQualityTargetKey(family)]
}
