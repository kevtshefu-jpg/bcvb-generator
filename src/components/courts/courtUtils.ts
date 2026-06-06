import type { CourtArrowType, CourtObjectType } from '../../modules/sessions/sessionModels'

export function getObjectColor(type: CourtObjectType) {
  if (type === 'player_offense' || type === 'offense_player') return '#a32035'
  if (type === 'player_defense' || type === 'defense_player') return '#111827'
  if (type === 'cone') return '#f97316'
  if (type === 'ball') return '#d97706'
  if (type === 'screen') return '#101722'
  if (type === 'zone') return '#2563eb'
  return '#334155'
}

export function getArrowColor(type: CourtArrowType) {
  if (type === 'arrow_pass') return '#2563eb'
  if (type === 'arrow_dribble') return '#a32035'
  if (type === 'arrow_screen') return '#111827'
  return '#3a8960'
}

export function clampPercent(value: number) {
  return Math.max(4, Math.min(96, value))
}
