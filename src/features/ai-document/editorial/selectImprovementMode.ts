import type { ImprovementMode } from './elevateDocumentQuality'

export function selectImprovementMode(score: number): ImprovementMode {
  if (score < 60) return 'publication_rebuild'
  if (score < 82) return 'editorial_elevation'
  return 'light_fix'
}
