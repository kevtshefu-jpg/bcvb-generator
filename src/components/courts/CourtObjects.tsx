import type { PointerEvent } from 'react'
import type { CourtArrow, CourtObject, CourtObjectType, CourtZone } from '../../modules/sessions/sessionModels'
import { legacyToMeters, legacyToMetersX, legacyToMetersY, toSvgX, toSvgY, type NormalizedCourtType } from './courtGeometry'
import { getCourtTheme, type CourtThemeName } from './courtTheme'

type CourtObjectsProps = {
  courtType: NormalizedCourtType
  objects: CourtObject[]
  arrows: CourtArrow[]
  zones: CourtZone[]
  theme?: CourtThemeName
  editable?: boolean
  onObjectMove?: (id: string, x: number, y: number) => void
  selectedObjectId?: string
  onSelectObject?: (id: string) => void
}

function objectTeam(type: CourtObjectType) {
  if (type === 'player_defense' || type === 'defense_player') return 'defense'
  if (type === 'player_offense' || type === 'offense_player') return 'offense'
  if (type === 'cone') return 'cone'
  if (type === 'ball') return 'ball'
  if (type === 'screen') return 'screen'
  return 'neutral'
}

function arrowColor(type: string, theme: ReturnType<typeof getCourtTheme>) {
  if (type === 'arrow_pass') return theme.pass
  if (type === 'arrow_dribble') return theme.dribble
  if (type === 'arrow_screen') return theme.navy
  return theme.move
}

function arrowDash(type: string) {
  if (type === 'arrow_pass') return '10 8'
  if (type === 'arrow_dribble') return '5 6'
  return undefined
}

export function CourtObjects({ courtType, objects, arrows, zones, theme = 'bcvb-editorial', editable = false, onObjectMove, selectedObjectId, onSelectObject }: CourtObjectsProps) {
  const palette = getCourtTheme(theme)

  function pointerMove(object: CourtObject, event: PointerEvent<SVGGElement>) {
    if (!editable || !onObjectMove || event.buttons !== 1) return
    const svg = event.currentTarget.ownerSVGElement
    if (!svg) return
    const screenMatrix = svg.getScreenCTM()
    if (!screenMatrix) return
    const point = svg.createSVGPoint()
    point.x = event.clientX
    point.y = event.clientY
    const cursor = point.matrixTransform(screenMatrix.inverse())
    onObjectMove(object.id, cursor.x / 100, cursor.y / 100)
  }

  return (
    <g className="fiba-court-objects">
      {zones.map((zone) => {
        const x = legacyToMetersX(zone.x, courtType)
        const y = legacyToMetersY(zone.y, courtType)
        const width = zone.width > 14 ? zone.width / 100 * (courtType === 'full' ? 28 : 14) : zone.width
        const height = zone.height > 15 ? zone.height / 100 * 15 : zone.height
        return (
          <g key={zone.id}>
            <rect x={toSvgX(x, courtType)} y={toSvgY(y, courtType)} width={width * 100} height={height * 100} rx="8" fill={palette.zone} stroke={palette.bcvbRed} strokeWidth="3" strokeDasharray="10 8" />
            <text x={toSvgX(x, courtType) + 12} y={toSvgY(y, courtType) + 24} className="fiba-court-zone-label">{zone.label}</text>
          </g>
        )
      })}

      {arrows.map((arrow) => {
        const fromX = arrow.fromX
        const fromY = arrow.fromY
        const start = legacyToMeters({ x: fromX, y: fromY }, courtType)
        const end = legacyToMeters({ x: arrow.toX, y: arrow.toY }, courtType)
        const curve = arrow.type === 'arrow_move' ? 0 : 80
        const controlX = (toSvgX(start.x, courtType) + toSvgX(end.x, courtType)) / 2
        const controlY = (toSvgY(start.y, courtType) + toSvgY(end.y, courtType)) / 2 - curve
        const path = `M ${toSvgX(start.x, courtType)} ${toSvgY(start.y, courtType)} Q ${controlX} ${controlY} ${toSvgX(end.x, courtType)} ${toSvgY(end.y, courtType)}`
        const isScreen = arrow.type === 'arrow_screen'
        return (
          <g key={arrow.id} className={`fiba-arrow fiba-arrow--${arrow.type}`}>
            <path d={path} fill="none" stroke={arrowColor(arrow.type, palette)} strokeWidth={isScreen ? 10 : 4} strokeLinecap="round" strokeDasharray={arrowDash(arrow.type)} markerEnd={isScreen ? undefined : `url(#arrow-${arrow.type})`} />
            {arrow.label && <text x={controlX} y={controlY - 14} className="fiba-arrow-label">{arrow.label}</text>}
          </g>
        )
      })}

      {objects.map((object) => {
        const point = legacyToMeters(object, courtType)
        const team = objectTeam(object.type)
        const selected = selectedObjectId === object.id
        if (object.type === 'cone') {
          const x = toSvgX(point.x, courtType)
          const y = toSvgY(point.y, courtType)
          return (
            <g key={object.id} onPointerDown={() => onSelectObject?.(object.id)}>
              <polygon points={`${x},${y - 14} ${x - 12},${y + 12} ${x + 12},${y + 12}`} fill={object.color || palette.cone} stroke={palette.lineDark} strokeWidth="2" />
              {selected && <rect x={x - 18} y={y - 18} width="36" height="36" fill="none" stroke={palette.navy} strokeWidth="3" strokeDasharray="6 5" />}
            </g>
          )
        }

        if (object.type === 'ball') {
          const x = toSvgX(point.x, courtType)
          const y = toSvgY(point.y, courtType)
          return (
            <g key={object.id} onPointerDown={() => onSelectObject?.(object.id)}>
              <circle cx={x} cy={y} r="14" fill={object.color || palette.ball} stroke={palette.lineDark} strokeWidth="2" />
              <path d={`M ${x - 9} ${y} H ${x + 9}`} stroke={palette.lineDark} strokeWidth="1.5" />
              {selected && <circle cx={x} cy={y} r="22" fill="none" stroke={palette.navy} strokeWidth="3" strokeDasharray="6 5" />}
            </g>
          )
        }

        if (object.type === 'screen') {
          const x = toSvgX(point.x, courtType)
          const y = toSvgY(point.y, courtType)
          return (
            <g key={object.id} onPointerDown={() => onSelectObject?.(object.id)}>
              <rect x={x - 35} y={y - 8} width="70" height="16" rx="4" fill={object.color || palette.lineDark} opacity="0.86" />
              {selected && <rect x={x - 42} y={y - 15} width="84" height="30" fill="none" stroke={palette.bcvbRed} strokeWidth="3" strokeDasharray="6 5" />}
            </g>
          )
        }

        if (object.type === 'text') {
          return <text key={object.id} x={toSvgX(point.x, courtType)} y={toSvgY(point.y, courtType)} className="fiba-object-text" onPointerDown={() => onSelectObject?.(object.id)}>{object.label}</text>
        }

        const fill = object.color || (team === 'offense' ? palette.offense : team === 'defense' ? palette.defense : palette.neutral)
        const textFill = team === 'offense' || team === 'defense' ? '#ffffff' : palette.lineDark
        return (
          <g key={object.id} className="fiba-player" onPointerDown={() => onSelectObject?.(object.id)} onPointerMove={(event) => pointerMove(object, event)}>
            <circle cx={toSvgX(point.x, courtType)} cy={toSvgY(point.y, courtType)} r="32" fill={fill} stroke="#ffffff" strokeWidth="5" />
            {selected && <circle cx={toSvgX(point.x, courtType)} cy={toSvgY(point.y, courtType)} r="40" fill="none" stroke={palette.navy} strokeWidth="3" strokeDasharray="7 6" />}
            <text x={toSvgX(point.x, courtType)} y={toSvgY(point.y, courtType) + 7} textAnchor="middle" className="fiba-player-label" fill={textFill}>{object.label}</text>
          </g>
        )
      })}
    </g>
  )
}
