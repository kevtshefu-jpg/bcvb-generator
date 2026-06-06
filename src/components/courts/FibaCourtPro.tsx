import { useMemo } from 'react'
import type { CourtArrow, CourtObject, CourtType, CourtZone } from '../../modules/sessions/sessionModels'
import { getCourtDimensions, getCourtViewBox, normalizeCourtType, type NormalizedCourtType } from './courtGeometry'
import { getCourtTheme, type CourtThemeName } from './courtTheme'
import { CourtObjects } from './CourtObjects'
import { CourtLegend } from './CourtLegend'
import { FibaCourtCanvas } from './FibaCourtCanvas'
import '../../styles/court-pro.css'

type FibaCourtProProps = {
  frameId?: string
  courtType?: CourtType
  orientation?: 'horizontal' | 'vertical'
  theme?: CourtThemeName
  showLogo?: boolean
  showLegend?: boolean
  editable?: boolean
  objects?: CourtObject[]
  arrows?: CourtArrow[]
  zones?: CourtZone[]
  notes?: string
  onObjectMove?: (id: string, x: number, y: number) => void
  selectedObjectId?: string
  onSelectObject?: (id: string) => void
}

function markerColor(type: string, theme: ReturnType<typeof getCourtTheme>) {
  if (type === 'arrow_pass') return theme.pass
  if (type === 'arrow_dribble') return theme.dribble
  if (type === 'arrow_screen') return theme.navy
  return theme.move
}

function CourtMarkers({ theme }: { theme: ReturnType<typeof getCourtTheme> }) {
  const types = ['arrow_move', 'arrow_pass', 'arrow_dribble', 'arrow_screen']
  return (
    <defs>
      {types.map((type) => (
        <marker id={`arrow-${type}`} markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" key={type}>
          <path d="M0,0 L12,6 L0,12 z" fill={markerColor(type, theme)} />
        </marker>
      ))}
    </defs>
  )
}

export function FibaCourtPro({
  frameId,
  courtType = 'half-right',
  orientation = 'horizontal',
  theme = 'bcvb-editorial',
  showLogo = false,
  showLegend = true,
  editable = false,
  objects = [],
  arrows = [],
  zones = [],
  notes,
  onObjectMove,
  selectedObjectId,
  onSelectObject,
}: FibaCourtProProps) {
  const normalized = normalizeCourtType(courtType)
  const dimensions = getCourtDimensions(courtType)
  const palette = getCourtTheme(theme)
  const className = useMemo(() => {
    const sizeClass = normalized === 'full' ? 'full' : normalized === 'mini' ? 'mini' : 'half'
    return `bcvb-court-stage court-stage fiba-court-pro ${sizeClass} fiba-court-pro--${orientation} fiba-court-pro--${theme}`
  }, [normalized, orientation, theme])

  const resolvedCourtType = (normalized === 'mini' ? 'half-right' : normalized) as NormalizedCourtType

  return (
    <figure className={`print-court-frame ${normalized === 'full' ? 'full' : normalized === 'mini' ? 'mini' : 'half'}`} data-court-frame-id={frameId}>
      <div className={className} style={{ background: palette.wood }}>
        <svg className="bcvb-court-svg" viewBox={getCourtViewBox(resolvedCourtType)} role="img" aria-label="Terrain FIBA BCVB" preserveAspectRatio="xMidYMid meet">
          <CourtMarkers theme={palette} />
          <FibaCourtCanvas courtType={resolvedCourtType} theme={theme} showLogo={showLogo} />
          <CourtObjects courtType={resolvedCourtType} objects={objects} arrows={arrows} zones={zones} theme={theme} editable={editable} onObjectMove={onObjectMove} selectedObjectId={selectedObjectId} onSelectObject={onSelectObject} />
        </svg>
      </div>
      {showLegend && normalized !== 'mini' && dimensions.length > 10 && <CourtLegend compact />}
      {notes && <figcaption className="fiba-court-notes">{notes}</figcaption>}
    </figure>
  )
}
