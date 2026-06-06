import {
  getCourtScale,
  type CourtMode,
} from '../../generator/utils/courtGeometry'
import {
  renderFullCourtMarkupFiba,
  renderHalfCourtMarkupFiba,
} from '../../generator/utils/courtMarkupFiba'

type DiagramTeam = 'offense' | 'defense' | 'coach' | 'cone'
type DiagramArrowType = 'move' | 'pass' | 'dribble' | 'shot' | 'screen'

type DiagramPlayer = {
  id: string
  team: DiagramTeam
  x: number
  y: number
  label?: string
}

type DiagramBall = {
  x: number
  y: number
}

type DiagramArrow = {
  type: DiagramArrowType
  from?: string
  to?: string
  toX?: number
  toY?: number
  label?: string
}

type DiagramZone = {
  x: number
  y: number
  width: number
  height: number
  label?: string
}

type DiagramData = {
  title?: string
  court: CourtMode
  intent?: string
  players: DiagramPlayer[]
  ball?: DiagramBall
  arrows: DiagramArrow[]
  zones: DiagramZone[]
  notes: string[]
}

type DiagramSection = 'players' | 'ball' | 'arrows' | 'zones' | 'notes'

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase()
}

function normalizeTeam(value: string): DiagramTeam {
  const normalized = value.toLowerCase()

  if (/(defense|défense|defenseur|défenseur|x)/.test(normalized)) return 'defense'
  if (/(coach|entraineur|entraîneur)/.test(normalized)) return 'coach'
  if (/(cone|plot)/.test(normalized)) return 'cone'

  return 'offense'
}

function normalizeArrowType(value: string): DiagramArrowType {
  const normalized = value.toLowerCase()

  if (/(passe|pass)/.test(normalized)) return 'pass'
  if (/(dribble|conduite)/.test(normalized)) return 'dribble'
  if (/(tir|shot)/.test(normalized)) return 'shot'
  if (/(ecran|écran|screen)/.test(normalized)) return 'screen'

  return 'move'
}

function readValue(value: string) {
  return value.trim().replace(/^['"]|['"]$/g, '')
}

function readNumber(value: string) {
  const parsed = Number(readValue(value).replace(',', '.'))
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 0
}

function parseKeyValue(line: string) {
  const match = /^([a-zA-ZÀ-ÿ0-9_-]+)\s*:\s*(.*)$/.exec(line.trim())
  if (!match) return null

  return {
    key: normalizeKey(match[1]),
    value: readValue(match[2]),
  }
}

function applyItemValue(
  target: Record<string, unknown>,
  key: string,
  value: string
) {
  if (key === 'x' || key === 'y' || key === 'tox' || key === 'toy' || key === 'width' || key === 'height') {
    target[key] = readNumber(value)
    return
  }

  target[key] = readValue(value)
}

export function parseBcvbDiagramBlock(source: string): DiagramData {
  const diagram: DiagramData = {
    court: 'half',
    players: [],
    arrows: [],
    zones: [],
    notes: [],
  }

  let section: DiagramSection | null = null
  let currentItem: Record<string, unknown> | null = null

  function commitCurrentItem() {
    if (!currentItem || !section) return

    if (section === 'players' && currentItem.id) {
      diagram.players.push({
        id: String(currentItem.id),
        team: normalizeTeam(String(currentItem.team ?? 'offense')),
        x: Number(currentItem.x ?? 50),
        y: Number(currentItem.y ?? 50),
        label: currentItem.label ? String(currentItem.label) : undefined,
      })
    }

    if (section === 'arrows') {
      diagram.arrows.push({
        type: normalizeArrowType(String(currentItem.type ?? 'move')),
        from: currentItem.from ? String(currentItem.from) : undefined,
        to: currentItem.to ? String(currentItem.to) : undefined,
        toX: typeof currentItem.tox === 'number' ? currentItem.tox : undefined,
        toY: typeof currentItem.toy === 'number' ? currentItem.toy : undefined,
        label: currentItem.label ? String(currentItem.label) : undefined,
      })
    }

    if (section === 'ball') {
      const holder = currentItem.holder ? String(currentItem.holder) : null
      const holderPlayer = holder
        ? diagram.players.find((player) => player.id.toLowerCase() === holder.toLowerCase())
        : null
      diagram.ball = {
        x: Number(currentItem.x ?? holderPlayer?.x ?? 50),
        y: Number(currentItem.y ?? holderPlayer?.y ?? 50),
      }
    }

    if (section === 'zones') {
      diagram.zones.push({
        x: Number(currentItem.x ?? 50),
        y: Number(currentItem.y ?? 50),
        width: Number(currentItem.width ?? 18),
        height: Number(currentItem.height ?? 18),
        label: currentItem.label ? String(currentItem.label) : undefined,
      })
    }

    currentItem = null
  }

  for (const rawLine of source.split('\n')) {
    const trimmed = rawLine.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const listMatch = /^-\s*(.*)$/.exec(trimmed)
    if (listMatch) {
      if (section === 'notes') {
        diagram.notes.push(readValue(listMatch[1]))
        continue
      }

      commitCurrentItem()
      currentItem = {}

      const inline = parseKeyValue(listMatch[1])
      if (inline) {
        applyItemValue(currentItem, inline.key, inline.value)
      }

      continue
    }

    const parsed = parseKeyValue(trimmed)
    if (!parsed) continue

    if (['players', 'ball', 'arrows', 'zones', 'notes'].includes(parsed.key)) {
      commitCurrentItem()
      section = parsed.key as DiagramSection
      currentItem = section === 'ball' ? {} : null
      continue
    }

    if (currentItem && section && section !== 'notes') {
      applyItemValue(currentItem, parsed.key, parsed.value)
      continue
    }

    if (section === 'ball') {
      currentItem = currentItem ?? {}
      applyItemValue(currentItem, parsed.key, parsed.value)
      const holder = currentItem.holder ? String(currentItem.holder) : null
      const holderPlayer = holder
        ? diagram.players.find((player) => player.id.toLowerCase() === holder.toLowerCase())
        : null
      diagram.ball = {
        x: Number(currentItem.x ?? holderPlayer?.x ?? 50),
        y: Number(currentItem.y ?? holderPlayer?.y ?? 50),
      }
      continue
    }

    if (parsed.key === 'title') diagram.title = parsed.value
    if (parsed.key === 'intent') diagram.intent = parsed.value
    if (parsed.key === 'court') {
      diagram.court = /full|plein/i.test(parsed.value) ? 'full' : 'half'
    }
  }

  commitCurrentItem()

  return diagram
}

function pointToPx(point: { x: number; y: number }, width: number, height: number) {
  return {
    x: (point.x / 100) * width,
    y: (point.y / 100) * height,
  }
}

function playerStyle(team: DiagramTeam) {
  if (team === 'defense') return { fill: '#111111', stroke: '#ffffff', text: '#ffffff' }
  if (team === 'coach') return { fill: '#7de2d1', stroke: '#111111', text: '#111111' }
  if (team === 'cone') return { fill: '#d97706', stroke: '#7c2d12', text: '#ffffff' }
  return { fill: '#ffffff', stroke: '#111111', text: '#9b0b22' }
}

function renderPlayer(player: DiagramPlayer, width: number, height: number) {
  const { x, y } = pointToPx(player, width, height)
  const style = playerStyle(player.team)

  if (player.team === 'cone') {
    return `<g transform="translate(${x}, ${y})"><polygon points="-10,9 10,9 0,-13" fill="${style.fill}" stroke="${style.stroke}" stroke-width="2.2" /></g>`
  }

  return `
    <g transform="translate(${x}, ${y})">
      <circle r="16" fill="${style.fill}" stroke="${style.stroke}" stroke-width="3" />
      <text x="0" y="5" text-anchor="middle" font-size="11" font-weight="900" fill="${style.text}">
        ${escapeXml(player.label || player.id)}
      </text>
    </g>
  `
}

function arrowStyle(type: DiagramArrowType) {
  if (type === 'pass') return { color: '#1d4ed8', dash: '10 6' }
  if (type === 'dribble') return { color: '#c8102e', dash: '4 5' }
  if (type === 'shot') return { color: '#15803d', dash: '' }
  if (type === 'screen') return { color: '#111111', dash: '2 7' }
  return { color: '#111111', dash: '' }
}

function renderArrow(
  arrow: DiagramArrow,
  players: DiagramPlayer[],
  width: number,
  height: number
) {
  const from = players.find((player) => player.id === arrow.from)
  if (!from) return ''

  const to = arrow.to
    ? players.find((player) => player.id === arrow.to)
    : undefined

  const start = pointToPx(from, width, height)
  const end = pointToPx(
    to ?? { x: arrow.toX ?? from.x, y: arrow.toY ?? from.y },
    width,
    height
  )
  const style = arrowStyle(arrow.type)
  const labelX = (start.x + end.x) / 2
  const labelY = (start.y + end.y) / 2 - 8

  return `
    <g>
      <line
        x1="${start.x}"
        y1="${start.y}"
        x2="${end.x}"
        y2="${end.y}"
        stroke="${style.color}"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
        ${style.dash ? `stroke-dasharray="${style.dash}"` : ''}
        marker-end="url(#bcvb-doc-arrow)"
      />
      ${
        arrow.label
          ? `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="11" font-weight="900" fill="${style.color}">${escapeXml(arrow.label)}</text>`
          : ''
      }
    </g>
  `
}

function renderBall(ball: DiagramBall, width: number, height: number) {
  const { x, y } = pointToPx(ball, width, height)

  return `
    <g transform="translate(${x}, ${y})">
      <circle r="7" fill="#f4b400" stroke="#7c4a00" stroke-width="2" />
      <path d="M -6 0 H 6 M 0 -6 V 6" stroke="#7c4a00" stroke-width="1.2" />
    </g>
  `
}

function renderZone(zone: DiagramZone, width: number, height: number) {
  const { x, y } = pointToPx(zone, width, height)
  const zoneWidth = (zone.width / 100) * width
  const zoneHeight = (zone.height / 100) * height

  return `
    <g>
      <rect
        x="${x - zoneWidth / 2}"
        y="${y - zoneHeight / 2}"
        width="${zoneWidth}"
        height="${zoneHeight}"
        rx="12"
        fill="rgba(200,16,46,0.12)"
        stroke="#c8102e"
        stroke-width="2.2"
        stroke-dasharray="8 6"
      />
      ${
        zone.label
          ? `<text x="${x}" y="${y}" text-anchor="middle" font-size="12" font-weight="900" fill="#9b0b22">${escapeXml(zone.label)}</text>`
          : ''
      }
    </g>
  `
}

export function renderBcvbDiagramSvg(source: string): string {
  const diagram = parseBcvbDiagramBlock(source)

  if (diagram.players.length === 0 && !diagram.ball && diagram.arrows.length === 0) {
    return `
      <aside class="diagram-fallback">
        <strong>Schéma pédagogique non interprétable</strong>
        <span>Données terrain absentes ou incomplètes. Utiliser un bloc bcvb-diagram avec players, ball et arrows.</span>
      </aside>
    `
  }

  const targetHeightPx = diagram.court === 'full' ? 520 : 560
  const padding = 18
  const scale = getCourtScale(diagram.court, targetHeightPx)
  const innerWidth = scale.widthPx
  const innerHeight = scale.heightPx
  const svgWidth = innerWidth + padding * 2
  const svgHeight = innerHeight + padding * 2
  const courtMarkup =
    diagram.court === 'full'
      ? renderFullCourtMarkupFiba(innerWidth, innerHeight, scale.pxPerMeter)
      : renderHalfCourtMarkupFiba(innerWidth, innerHeight, scale.pxPerMeter)

  const notesHtml = diagram.notes.length
    ? `<ul class="diagram-notes">${diagram.notes
        .map((note) => `<li>${escapeXml(note)}</li>`)
        .join('')}</ul>`
    : ''

  const svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 ${svgWidth} ${svgHeight}"
      role="img"
      aria-label="${escapeXml(diagram.title || 'Schéma terrain BCVB')}"
    >
      <defs>
        <linearGradient id="bcvb-doc-wood" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#d8a35d" />
          <stop offset="52%" stop-color="#cd9855" />
          <stop offset="100%" stop-color="#c58945" />
        </linearGradient>
        <pattern id="bcvb-doc-wood-pattern" patternUnits="userSpaceOnUse" width="80" height="80">
          <rect width="80" height="80" fill="url(#bcvb-doc-wood)" />
          <path d="M0 0 H80 M0 20 H80 M0 40 H80 M0 60 H80" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
          <path d="M0 0 V80 M20 0 V80 M40 0 V80 M60 0 V80" stroke="rgba(0,0,0,0.04)" stroke-width="1" />
        </pattern>
        <marker id="bcvb-doc-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <polygon points="0 0, 10 5, 0 10" fill="#111111" />
        </marker>
      </defs>
      <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" rx="18" fill="#ffffff" />
      <g transform="translate(${padding}, ${padding})">
        <rect x="0" y="0" width="${innerWidth}" height="${innerHeight}" rx="12" fill="url(#bcvb-doc-wood-pattern)" />
        ${courtMarkup}
        ${diagram.zones.map((zone) => renderZone(zone, innerWidth, innerHeight)).join('')}
        ${diagram.arrows.map((arrow) => renderArrow(arrow, diagram.players, innerWidth, innerHeight)).join('')}
        ${diagram.players.map((player) => renderPlayer(player, innerWidth, innerHeight)).join('')}
        ${diagram.ball ? renderBall(diagram.ball, innerWidth, innerHeight) : ''}
      </g>
    </svg>
  `

  return `
    <figure class="bcvb-diagram-block">
      <figcaption>
        <span>Schéma terrain</span>
        <strong>${escapeXml(diagram.title || 'Situation BCVB')}</strong>
        ${diagram.intent ? `<small>${escapeXml(diagram.intent)}</small>` : ''}
      </figcaption>
      <div class="bcvb-diagram-svg">${svg}</div>
      ${notesHtml}
    </figure>
  `
}
