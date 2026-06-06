import { courtTokens } from './courtTokens.js'
import { FIBA_COURT, legacyPointToMeters, meterToSvgX, meterToSvgY, normalizePoint, svgPointToMeters } from './fibaCourtGeometry.js'

function getObjectColor(object) {
  if (object.color) return object.color
  if (object.type === 'defense_player' || object.type === 'player_defense') return courtTokens.defense
  if (object.type === 'ball' || object.type === 'cone') return courtTokens.ball
  if (object.type === 'screen') return courtTokens.bcvbNavy
  return courtTokens.offense
}

function objectLabel(object) {
  if (object.label) return object.label
  if (object.type === 'defense_player' || object.type === 'player_defense') return 'D'
  if (object.type === 'ball') return ''
  if (object.type === 'screen') return ''
  return '1'
}

function handlePointerMove(object, event, mode, onObjectMove) {
  if (!onObjectMove || event.buttons !== 1) return
  const svg = event.currentTarget.ownerSVGElement
  const matrix = svg?.getScreenCTM()
  if (!svg || !matrix) return
  const cursor = svg.createSVGPoint()
  cursor.x = event.clientX
  cursor.y = event.clientY
  const next = svgPointToMeters(cursor.matrixTransform(matrix.inverse()), mode)
  onObjectMove(object.id, next.x, next.y)
}

function TacticalObject({ object, mode, selectedObjectId, onObjectMove, onSelectObject }) {
  const point = legacyPointToMeters(object, mode)
  const x = meterToSvgX(point.x, mode)
  const y = meterToSvgY(point.y, mode)
  const selected = selectedObjectId === object.id
  const color = getObjectColor(object)
  const commonProps = {
    className: selected ? 'bcvb-court-object is-selected' : 'bcvb-court-object',
    onPointerDown: () => onSelectObject?.(object.id),
    onPointerMove: (event) => handlePointerMove(object, event, mode, onObjectMove),
  }

  if (object.type === 'ball') {
    return (
      <g {...commonProps}>
        <circle cx={x} cy={y} r="14" fill={color} stroke={courtTokens.courtLineDark} strokeWidth="2.5" />
        {selected && <circle cx={x} cy={y} r="22" fill="none" stroke={courtTokens.bcvbNavy} strokeWidth="3" strokeDasharray="6 5" />}
      </g>
    )
  }

  if (object.type === 'cone') {
    return (
      <g {...commonProps}>
        <polygon points={`${x},${y - 14} ${x - 12},${y + 12} ${x + 12},${y + 12}`} fill={color} stroke={courtTokens.courtLineDark} strokeWidth="2.5" />
        {selected && <rect x={x - 18} y={y - 18} width="36" height="36" fill="none" stroke={courtTokens.bcvbNavy} strokeWidth="3" strokeDasharray="6 5" />}
      </g>
    )
  }

  if (object.type === 'screen') {
    return (
      <g {...commonProps}>
        <rect x={x - 35} y={y - 8} width="70" height="16" rx="4" fill={color} />
        {selected && <rect x={x - 42} y={y - 15} width="84" height="30" fill="none" stroke={courtTokens.bcvbRed} strokeWidth="3" strokeDasharray="6 5" />}
      </g>
    )
  }

  if (object.type === 'zone') {
    return null
  }

  if (object.type === 'text') {
    return (
      <text {...commonProps} x={x} y={y} className="bcvb-court-text">
        {objectLabel(object)}
      </text>
    )
  }

  return (
    <g {...commonProps}>
      <circle cx={x} cy={y} r="32" fill={color} stroke="#ffffff" strokeWidth="5" />
      {selected && <circle cx={x} cy={y} r="40" fill="none" stroke={courtTokens.bcvbNavy} strokeWidth="3" strokeDasharray="7 6" />}
      <text x={x} y={y + 10} textAnchor="middle" className="bcvb-court-player-label" fill="#ffffff">
        {objectLabel(object)}
      </text>
    </g>
  )
}

function Arrow({ arrow, mode }) {
  const from = normalizePoint(arrow.fromX, arrow.fromY, mode)
  const to = normalizePoint(arrow.toX, arrow.toY, mode)
  const color = arrow.type === 'arrow_pass' ? courtTokens.pass : arrow.type === 'arrow_dribble' ? courtTokens.dribble : courtTokens.courtLineDark
  const dash = arrow.type === 'arrow_pass' ? '18 14' : arrow.type === 'arrow_dribble' ? '7 9' : undefined
  const marker = `url(#bcvb-arrow-${arrow.type || 'move'})`
  return (
    <g>
      <path
        d={`M ${meterToSvgX(from.x, mode)} ${meterToSvgY(from.y, mode)} L ${meterToSvgX(to.x, mode)} ${meterToSvgY(to.y, mode)}`}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={dash}
        markerEnd={marker}
      />
      {arrow.label && (
        <text x={(meterToSvgX(from.x, mode) + meterToSvgX(to.x, mode)) / 2} y={(meterToSvgY(from.y, mode) + meterToSvgY(to.y, mode)) / 2 - 12} className="bcvb-court-arrow-label">
          {arrow.label}
        </text>
      )}
    </g>
  )
}

function Zone({ zone, mode }) {
  const point = legacyPointToMeters(zone, mode)
  const width = Number.isFinite(zone.width) ? zone.width : 3
  const height = Number.isFinite(zone.height) ? zone.height : 2
  return (
    <g>
      <rect x={meterToSvgX(point.x, mode)} y={meterToSvgY(point.y, mode)} width={width * FIBA_COURT.scale} height={height * FIBA_COURT.scale} rx="8" fill={courtTokens.zoneFill} stroke={courtTokens.bcvbRed} strokeWidth="3" strokeDasharray="10 8" />
      {zone.label && <text x={meterToSvgX(point.x, mode) + 12} y={meterToSvgY(point.y, mode) + 28} className="bcvb-court-zone-label">{zone.label}</text>}
    </g>
  )
}

export default function FibaCourtObjects({
  mode = 'half-right',
  objects = [],
  arrows = [],
  zones = [],
  selectedObjectId,
  onObjectMove,
  onSelectObject,
}) {
  return (
    <g className="bcvb-court-objects">
      {zones.map((zone) => <Zone key={zone.id} zone={zone} mode={mode} />)}
      {arrows.map((arrow) => <Arrow key={arrow.id} arrow={arrow} mode={mode} />)}
      {objects.map((object) => (
        <TacticalObject
          key={object.id}
          object={object}
          mode={mode}
          selectedObjectId={selectedObjectId}
          onObjectMove={onObjectMove}
          onSelectObject={onSelectObject}
        />
      ))}
    </g>
  )
}
