import { getCourtGeometry } from './court/CourtGeometry'
import { mapCourtPoint, mapCourtSize } from './court/courtCoordinateMapper'

export type CourtDiagramPlayer = {
  id: string
  team: 'offense' | 'defense' | 'coach' | 'cone' | 'zone'
  x: number
  y: number
  label?: string
}

export type CourtDiagramArrow = {
  type: 'move' | 'pass' | 'dribble' | 'shot' | 'screen'
  from?: string
  toX: number
  toY: number
  label?: string
}

export type CourtDiagramZone = {
  x: number
  y: number
  width: number
  height: number
  label?: string
}

export type CourtDiagramProps = {
  title?: string
  court?: 'half' | 'full'
  intent?: string
  players?: CourtDiagramPlayer[]
  ball?: { x: number; y: number }
  arrows?: CourtDiagramArrow[]
  zones?: CourtDiagramZone[]
  notes?: string[]
}

function playerColors(team: CourtDiagramPlayer['team']) {
  if (team === 'defense') return { fill: '#111827', stroke: '#ffffff', text: '#ffffff' }
  if (team === 'coach') return { fill: '#7dd3fc', stroke: '#075985', text: '#111827' }
  if (team === 'cone' || team === 'zone') return { fill: '#f97316', stroke: '#9a3412', text: '#ffffff' }
  return { fill: '#c8102e', stroke: '#ffffff', text: '#ffffff' }
}

function arrowColor(type: CourtDiagramArrow['type']) {
  if (type === 'pass') return { color: '#111827', dash: '10 8' }
  if (type === 'dribble') return { color: '#c8102e', dash: '5 6' }
  if (type === 'shot') return { color: '#c8102e', dash: '' }
  if (type === 'screen') return { color: '#6b7280', dash: '2 7' }
  return { color: '#111827', dash: '' }
}

function CourtMarkings({
  geometry,
  side = 'top',
}: {
  geometry: ReturnType<typeof getCourtGeometry>
  side?: 'top' | 'bottom'
}) {
  const {
    courtX,
    courtY,
    courtW,
    courtH,
    hoopX,
    hoopY,
    freeThrowY,
    paintW,
    paintH,
  } = geometry
  const isTop = side === 'top'
  const baselineY = isTop ? courtY : courtY + courtH
  const hoopCenterY = isTop ? hoopY : courtY + courtH - (hoopY - courtY)
  const boardY = isTop ? courtY + 30 : courtY + courtH - 30
  const freeThrowCenterY = isTop ? freeThrowY : courtY + courtH - (freeThrowY - courtY)
  const paintY = isTop ? courtY : courtY + courtH - paintH
  const paintX = hoopX - paintW / 2
  const innerPaintX = hoopX - 95
  const noChargeY = isTop ? hoopCenterY + 30 : hoopCenterY - 30
  const freeThrowArcSweep = isTop ? 0 : 1
  const noChargeSweep = isTop ? 0 : 1
  const centralArcY = isTop ? courtY + courtH : courtY
  const centralArcSweep = isTop ? 1 : 0
  const threePointPath = isTop
    ? `M${courtX + 90} ${courtY} L${courtX + 90} ${courtY + 125} C${courtX + 130} ${courtY + 415} ${courtX + courtW - 130} ${courtY + 415} ${courtX + courtW - 90} ${courtY + 125} L${courtX + courtW - 90} ${courtY}`
    : `M${courtX + 90} ${courtY + courtH} L${courtX + 90} ${courtY + courtH - 125} C${courtX + 130} ${courtY + courtH - 415} ${courtX + courtW - 130} ${courtY + courtH - 415} ${courtX + courtW - 90} ${courtY + courtH - 125} L${courtX + courtW - 90} ${courtY + courtH}`
  const hashY1 = isTop ? courtY + 85 : courtY + courtH - 85
  const hashY2 = isTop ? courtY + 165 : courtY + courtH - 165

  return (
    <>
      <rect x={paintX} y={paintY} width={paintW} height={paintH} className="court-white-line-fill" />
      <rect x={innerPaintX} y={paintY} width="190" height={paintH} className="court-white-line-fill court-key-inner" />
      <circle cx={hoopX} cy={freeThrowCenterY} r="82" className="court-white-line-fill" />
      <path
        d={`M${hoopX - 82} ${freeThrowCenterY} A82 82 0 0 ${freeThrowArcSweep} ${hoopX + 82} ${freeThrowCenterY}`}
        className="court-white-line-fill"
        strokeDasharray="12 10"
      />
      <line x1={hoopX - 60} y1={boardY} x2={hoopX + 60} y2={boardY} className="court-basket-board" />
      <circle cx={hoopX} cy={hoopCenterY} r="17" className="court-rim" />
      <path
        d={`M${hoopX - 60} ${noChargeY} A60 60 0 0 ${noChargeSweep} ${hoopX + 60} ${noChargeY}`}
        className="court-white-line-fill"
        strokeDasharray="10 8"
      />
      <path d={threePointPath} className="court-white-line-fill" />
      <path
        d={`M${hoopX - 80} ${centralArcY} A80 80 0 0 ${centralArcSweep} ${hoopX + 80} ${centralArcY}`}
        className="court-white-line-fill"
      />
      <line x1={paintX - 10} y1={hashY1} x2={paintX} y2={hashY1} className="court-white-line" />
      <line x1={paintX + paintW} y1={hashY1} x2={paintX + paintW + 10} y2={hashY1} className="court-white-line" />
      <line x1={paintX - 10} y1={hashY2} x2={paintX} y2={hashY2} className="court-white-line" />
      <line x1={paintX + paintW} y1={hashY2} x2={paintX + paintW + 10} y2={hashY2} className="court-white-line" />
      <line x1={courtX} y1={baselineY} x2={courtX + courtW} y2={baselineY} className="court-white-line" />
    </>
  )
}

export function BCVBCourtDiagram({
  title,
  court = 'half',
  intent,
  players = [],
  ball,
  arrows = [],
  zones = [],
  notes = [],
}: CourtDiagramProps) {
  const geometry = getCourtGeometry(court)
  const {
    width,
    height,
    courtX,
    courtY,
    courtW,
    courtH,
  } = geometry
  const fullCourt = court === 'full'
  const midCourtY = courtY + courtH / 2

  return (
    <figure className="bcvb-court-card">
      <figcaption>
        <span>Schéma terrain</span>
        <strong>{title || 'Organisation terrain'}</strong>
        {intent && <small>{intent}</small>}
      </figcaption>

      <div className="bcvb-court-diagram-shell">
        <svg
          className="bcvb-court-diagram"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={title || 'Schéma terrain BCVB'}
        >
          <defs>
            <pattern id="woodPattern" patternUnits="userSpaceOnUse" width="90" height="90">
              <rect width="90" height="90" fill="#d6a25c" />
              <path d="M0 20 H90 M0 55 H90" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
              <path d="M20 0 V90 M55 0 V90" stroke="rgba(120,70,20,0.08)" strokeWidth="2" />
            </pattern>
            <marker id="bcvbArrow" markerWidth="14" markerHeight="14" refX="11" refY="5" orient="auto">
              <path d="M0,0 L0,10 L12,5 z" fill="currentColor" />
            </marker>
            <marker id="bcvbArrowRed" markerWidth="14" markerHeight="14" refX="11" refY="5" orient="auto">
              <path d="M0,0 L0,10 L12,5 z" fill="#c8102e" />
            </marker>
          </defs>

          <rect x={courtX} y={courtY} width={courtW} height={courtH} rx="18" fill="url(#woodPattern)" stroke="#111827" strokeWidth="4" />

          {fullCourt && (
            <>
              <line x1={courtX} y1={midCourtY} x2={courtX + courtW} y2={midCourtY} className="court-white-line court-midline" />
              <circle cx={width / 2} cy={midCourtY} r="80" className="court-white-line-fill" />
            </>
          )}

          <CourtMarkings geometry={geometry} side="top" />
          {fullCourt && <CourtMarkings geometry={geometry} side="bottom" />}

          {zones.map((zone, index) => {
            const point = mapCourtPoint(zone, geometry)
            const size = mapCourtSize(zone, geometry)
            return (
              <g key={`zone-${index}`}>
                <rect
                  x={point.x - size.width / 2}
                  y={point.y - size.height / 2}
                  width={size.width}
                  height={size.height}
                  rx="16"
                  fill="rgba(200,16,46,0.16)"
                  stroke="#c8102e"
                  strokeWidth="4"
                  strokeDasharray="8 6"
                />
                {zone.label && (
                  <g>
                    <rect x={point.x - 48} y={point.y - 15} width="96" height="26" rx="13" fill="rgba(255,255,255,0.86)" />
                    <text x={point.x} y={point.y + 4} textAnchor="middle" fontWeight="900" fill="#7f1d1d">{zone.label}</text>
                  </g>
                )}
              </g>
            )
          })}

          {arrows.map((arrow, index) => {
            const from = players.find((player) => player.id === arrow.from) ?? players[0]
            if (!from) return null
            const start = mapCourtPoint(from, geometry)
            const end = mapCourtPoint({ x: arrow.toX, y: arrow.toY }, geometry)
            const style = arrowColor(arrow.type)
            const marker = arrow.type === 'dribble' || arrow.type === 'shot' ? 'url(#bcvbArrowRed)' : 'url(#bcvbArrow)'
            return (
              <g key={`arrow-${index}`}>
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={style.color}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={style.dash}
                  markerEnd={marker}
                />
                {arrow.label && (
                  <g>
                    <rect x={(start.x + end.x) / 2 - 48} y={(start.y + end.y) / 2 - 30} width="96" height="24" rx="12" fill="rgba(255,255,255,0.88)" />
                    <text x={(start.x + end.x) / 2} y={(start.y + end.y) / 2 - 13} textAnchor="middle" fontWeight="900" fill={style.color}>{arrow.label}</text>
                  </g>
                )}
              </g>
            )
          })}

          {players.map((player) => {
            const point = mapCourtPoint(player, geometry)
            const colors = playerColors(player.team)
            if (player.team === 'cone' || player.team === 'zone') {
              return (
                <g key={player.id} transform={`translate(${point.x}, ${point.y})`}>
                  <polygon points="-16,14 16,14 0,-20" fill={colors.fill} stroke={colors.stroke} strokeWidth="4" />
                  <text y="34" textAnchor="middle" fontSize="15" fontWeight="900" fill="#111827">{player.label || player.id}</text>
                </g>
              )
            }
            return (
              <g key={player.id} transform={`translate(${point.x}, ${point.y})`}>
                <circle r="24" fill={colors.fill} stroke={colors.stroke} strokeWidth="5" />
                <text y="6" textAnchor="middle" fontSize="15" fontWeight="900" fill={colors.text}>{player.label || player.id}</text>
              </g>
            )
          })}

          {ball && (
            <g transform={`translate(${mapCourtPoint(ball, geometry).x}, ${mapCourtPoint(ball, geometry).y})`}>
              <circle r="13" fill="#f59e0b" stroke="#7c2d12" strokeWidth="4" />
              <path d="M -10 0 H 10 M 0 -10 V 10" stroke="#7c2d12" strokeWidth="2" />
            </g>
          )}
        </svg>
      </div>

      <div className="bcvb-diagram-auto-legend">
        <span><i className="legend-line legend-line--move" />Déplacement</span>
        <span><i className="legend-line legend-line--pass" />Passe</span>
        <span><i className="legend-line legend-line--dribble" />Dribble</span>
        <span><i className="legend-dot legend-dot--defense" />Défenseur</span>
        <span><i className="legend-dot legend-dot--cone" />Plot / zone</span>
      </div>

      {notes.length > 0 && (
        <ul className="bcvb-diagram-legend">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
    </figure>
  )
}
