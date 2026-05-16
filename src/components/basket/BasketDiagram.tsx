type Player = {
  id: string
  x: number
  y: number
  team?: 'offense' | 'defense'
  hasBall?: boolean
}

type Action = {
  type: 'pass' | 'cut' | 'screen' | 'dribble' | 'shot'
  from?: string
  to?: string | { x: number; y: number }
  player?: string
  for?: string
  at?: { x: number; y: number }
}

type Annotation = {
  text: string
  x: number
  y: number
}

type DiagramData = {
  title: string
  players: Player[]
  actions?: Action[]
  annotations?: Annotation[]
}

function findPlayer(players: Player[], id?: string) {
  return players.find((p) => p.id === id)
}

function buildWavyPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  amplitude = 1.2,
  waves = 8
) {
  const dx = x2 - x1
  const dy = y2 - y1
  const length = Math.sqrt(dx * dx + dy * dy)

  if (length === 0) return `M ${x1} ${y1}`

  const nx = -dy / length
  const ny = dx / length

  let path = `M ${x1} ${y1}`

  for (let i = 1; i <= waves; i++) {
    const t = i / waves
    const wave = i % 2 === 0 ? -amplitude : amplitude

    const x = x1 + dx * t + nx * wave
    const y = y1 + dy * t + ny * wave

    path += ` L ${x} ${y}`
  }

  path += ` L ${x2} ${y2}`

  return path
}

function getPlayerStyle(player: Player) {
  if (player.team === 'defense') {
    return {
      background: '#111111',
      border: '2px solid #c8102e',
    }
  }

  return {
    background: '#c8102e',
    border: '2px solid white',
  }
}

export default function BasketDiagram({ data }: { data: DiagramData }) {
  const players = data.players ?? []
  const actions = data.actions ?? []
  const annotations = data.annotations ?? []

  return (
    <div style={{ border: '1px solid #ddd', padding: 20, borderRadius: 12, background: '#fff' }}>
      <h3>{data.title}</h3>

      <div
        style={{
          position: 'relative',
          width: 420,
          height: 360,
          background: '#f8f1e7',
          border: '2px solid #111',
          overflow: 'hidden',
        }}
      >
        <svg width="420" height="360" viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,4 L0,8 Z" fill="black" />
            </marker>
          </defs>

          {/* Demi-terrain */}
          <line x1="0" y1="100" x2="100" y2="100" stroke="#111" strokeWidth="0.6" />
          <rect x="36" y="0" width="28" height="37" fill="none" stroke="#111" strokeWidth="0.6" />
          <circle cx="50" cy="37" r="12" fill="none" stroke="#111" strokeWidth="0.6" />
          <circle cx="50" cy="6" r="1.2" fill="#111" />
          <line x1="44" y1="4" x2="56" y2="4" stroke="#111" strokeWidth="0.8" />
          <path d="M13 0 C13 48, 87 48, 87 0" fill="none" stroke="#111" strokeWidth="0.6" />
          <path d="M41 0 C41 18, 59 18, 59 0" fill="none" stroke="#111" strokeWidth="0.6" strokeDasharray="2 2" />

          {/* Actions */}
          {actions.map((action, index) => {
            if (action.type === 'screen') {
              const screener = findPlayer(players, action.player)
              const x = action.at?.x ?? screener?.x
              const y = action.at?.y ?? screener?.y
              if (x === undefined || y === undefined) return null

              return (
                <g key={index}>
                  <line x1={x - 4} y1={y} x2={x + 4} y2={y} stroke="black" strokeWidth="2" />
                  <text x={x + 5} y={y - 2} fontSize="4" fill="black">Écran</text>
                </g>
              )
            }

            let start: Player | undefined
            let end: { x: number; y: number } | undefined

            if (action.type === 'pass') {
              start = findPlayer(players, action.from)
              const target = findPlayer(players, action.to as string)
              if (target) end = { x: target.x, y: target.y }
            }

            if (action.type === 'cut') {
              start = findPlayer(players, action.player)
              if (typeof action.to === 'object') end = action.to
            }

            if (action.type === 'dribble') {
              start = findPlayer(players, action.player)
              if (typeof action.to === 'object') end = action.to
            }

            if (action.type === 'shot') {
              start = findPlayer(players, action.player)
              if (typeof action.to === 'object') end = action.to
            }

            if (!start || !end) return null

            if (action.type === 'dribble') {
  return (
    <path
      key={index}
      d={buildWavyPath(start.x, start.y, end.x, end.y)}
      fill="none"
      stroke="black"
      strokeWidth="1.4"
      markerEnd="url(#arrow)"
    />
  )
}

if (action.type === 'shot') {
  return (
    <line
      key={index}
      x1={start.x}
      y1={start.y}
      x2={end.x}
      y2={end.y}
      stroke="#f59e0b"
      strokeWidth="2"
      markerEnd="url(#arrow)"
    />
  )
}

            return (
              <line
                key={index}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke="black"
                strokeWidth="1.6"
                strokeDasharray={action.type === 'pass' ? '4 3' : undefined}
                markerEnd="url(#arrow)"
              />
            )
          })}

          {/* Annotations */}
          {annotations.map((annotation, index) => (
            <text
              key={index}
              x={annotation.x}
              y={annotation.y}
              fontSize="4"
              fill="#111"
              fontWeight="700"
            >
              {annotation.text}
            </text>
          ))}
        </svg>

        {/* Joueurs */}
        {players.map((p) => {
          const style = getPlayerStyle(p)

          return (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                left: `${p.x}%`,
                top: `${p.y}%`,
                transform: 'translate(-50%, -50%)',
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: style.background,
                color: 'white',
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: style.border,
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                zIndex: 2,
              }}
            >
              {p.id}
            </div>
          )
        })}

        {/* Ballon */}
        {players
          .filter((p) => p.hasBall)
          .map((p) => (
            <div
              key={`${p.id}-ball`}
              style={{
                position: 'absolute',
                left: `calc(${p.x}% + 16px)`,
                top: `calc(${p.y}% - 12px)`,
                width: 11,
                height: 11,
                borderRadius: '50%',
                background: '#f28c28',
                border: '1px solid #111',
                zIndex: 3,
              }}
            />
          ))}
      </div>
    </div>
  )
}