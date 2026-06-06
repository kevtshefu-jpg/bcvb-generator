export type DiagramValidationIssue = {
  severity: 'critical' | 'major' | 'minor'
  message: string
}

export type DiagramValidationResult = {
  valid: boolean
  issues: DiagramValidationIssue[]
}

function clampScoreCoordinate(value: number) {
  return Number.isFinite(value) && value >= 5 && value <= 95
}

function blockBody(source: string) {
  return source.replace(/^:::bcvb-diagram/i, '').replace(/:::$/m, '')
}

export function validateBcvbDiagramBlock(source: string): DiagramValidationResult {
  const body = blockBody(source)
  const issues: DiagramValidationIssue[] = []
  const hasPlayers = /players\s*:\s*\n\s*-\s+/i.test(body)
  const hasArrows = /arrows\s*:\s*\n\s*-\s+/i.test(body)
  const hasNotes = /notes\s*:\s*\n\s*-\s+/i.test(body)
  const hasBall = /ball\s*:/i.test(body)
  const hasZones = /zones\s*:\s*\n\s*-\s+/i.test(body)
  const arrowNeedsBall = /type\s*:\s*(pass|passe|dribble|shot|tir)/i.test(body)

  if (!hasPlayers) issues.push({ severity: 'critical', message: 'Diagramme sans players.' })
  if (!hasArrows) issues.push({ severity: 'critical', message: 'Diagramme sans arrows.' })
  if (!hasNotes) issues.push({ severity: 'major', message: 'Diagramme sans notes coachables.' })
  if (arrowNeedsBall && !hasBall) {
    issues.push({ severity: 'major', message: 'Ballon absent alors que le diagramme décrit passe, dribble ou tir.' })
  }
  if (!hasZones && /transition|couloir|zone|spacing|aide|repli|press/i.test(body)) {
    issues.push({ severity: 'minor', message: 'Zones utiles absentes pour clarifier la lecture terrain.' })
  }

  const coordinates = Array.from(body.matchAll(/\b(?:x|y|toX|toY)\s*:\s*(-?\d+(?:[.,]\d+)?)/gi))
    .map((match) => Number(match[1].replace(',', '.')))

  if (coordinates.some((value) => !clampScoreCoordinate(value))) {
    issues.push({ severity: 'critical', message: 'Coordonnées hors zone lisible 5–95.' })
  }

  if (/label\s*:\s*$/im.test(body)) {
    issues.push({ severity: 'minor', message: 'Label vide détecté.' })
  }

  return {
    valid: !issues.some((issue) => issue.severity === 'critical'),
    issues,
  }
}

export function countIncompleteDiagrams(document: string) {
  const blocks = document.match(/:::bcvb-diagram[\s\S]*?:::/g) ?? []
  return blocks.filter((block) => !validateBcvbDiagramBlock(block).valid).length
}
