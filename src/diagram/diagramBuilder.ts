import type { BCVBSession, DiagramData, DiagramElement, DiagramAction } from '../types/session'

export const COURT = {
  width: 720,
  height: 460,
  halfCourt: {
    width: 720,
    height: 460,
    baseLine: 0,
    endLine: 460,
    threePointX: 237,
    basketX: 360,
    basketY: 41,
    paintWidth: 160,
    paintHeight: 190
  },
  colors: {
    line: '#1a1a1a',
    layout: '#fff5e1',
    attacker: '#ff6b6b',
    defender: '#1d3557',
    coach: '#2a9d8f',
    cone: '#faa618',
    ball: '#ffd600',
    text: '#1a1a1a'
  },
  lineWidth: 2
}

export function buildDiagramFromSessionData(session: BCVBSession): DiagramData {
  const elements: DiagramElement[] = []
  const actions: DiagramAction[] = []

  // Coach at center-top
  elements.push({
    id: 'coach-1',
    type: 'coach',
    x: 50,
    y: 15,
    label: 'Coach'
  })

  // Detect setup keywords to auto-place elements
  const setupLower = (session.setup.join(' ') + ' ' + session.instructions.join(' ')).toLowerCase()

  // Attackers
  elements.push({
    id: 'att-1',
    type: 'attacker',
    x: 35,
    y: 60,
    label: 'A1'
  })
  elements.push({
    id: 'att-2',
    type: 'attacker',
    x: 65,
    y: 60,
    label: 'A2'
  })

  // Defender only if "1c1" or "1v1" is mentioned
  if (setupLower.includes('1c1') || setupLower.includes('1v1')) {
    elements.push({
      id: 'def-1',
      type: 'defender',
      x: 50,
      y: 75,
      label: 'D'
    })
  }

  // Ball
  elements.push({
    id: 'ball-1',
    type: 'ball',
    x: 35,
    y: 55
  })

  // Cones based on equipment keywords
  const coneCount = Math.min(
    (session.equipment.filter(e => e.includes('cône') || e.includes('cone')).length || 0) + 1,
    4
  )
  for (let i = 0; i < coneCount; i++) {
    elements.push({
      id: `cone-${i}`,
      type: 'cone',
      x: 20 + i * 20,
      y: 85
    })
  }

  // Auto-generate actions from keywords
  if (setupLower.includes('passe') || setupLower.includes('transmission')) {
    actions.push({
      id: 'act-1',
      type: 'pass',
      from: { elementId: 'att-1', x: 35, y: 60 },
      to: { elementId: 'att-2', x: 65, y: 60 },
      label: 'Passe'
    })
  }

  if (setupLower.includes('tir') || setupLower.includes('shoot')) {
    actions.push({
      id: 'act-2',
      type: 'shot',
      from: { elementId: 'att-2', x: 65, y: 60 },
      to: { elementId: 'ball-1', x: 35, y: 55 },
      label: 'Tir'
    })
  }

  return {
    courtType: 'half',
    elements,
    actions
  }
}
