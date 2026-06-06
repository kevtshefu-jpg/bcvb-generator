import { BCVBCourtDiagram } from '../BCVBCourtDiagram'

export type CourtPlayer = {
  id: string
  label?: string
  team: 'offense' | 'defense' | 'coach' | 'cone' | 'zone'
  x: number
  y: number
}

export type CourtArrow = {
  type: 'move' | 'pass' | 'dribble' | 'shot' | 'screen'
  from?: string
  toX: number
  toY: number
  label?: string
}

export type CourtZone = {
  x: number
  y: number
  width: number
  height: number
  label?: string
  color?: string
}

export type BCVBFibaCourtDiagramProps = {
  title?: string
  subtitle?: string
  court?: 'half' | 'full'
  orientation?: 'vertical' | 'horizontal'
  players?: CourtPlayer[]
  arrows?: CourtArrow[]
  zones?: CourtZone[]
  ball?: { x: number; y: number }
  notes?: string[]
}

export function BCVBFibaCourtDiagram({
  title,
  subtitle,
  court = 'half',
  players,
  arrows,
  zones,
  ball,
  notes,
}: BCVBFibaCourtDiagramProps) {
  return (
    <BCVBCourtDiagram
      title={title}
      intent={subtitle}
      court={court}
      players={players}
      arrows={arrows}
      zones={zones}
      ball={ball}
      notes={notes}
    />
  )
}
