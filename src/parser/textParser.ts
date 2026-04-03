import type { BCVBSession, SessionStep } from '../types/session'
import { SECTION_ALIASES, STEP_KEYWORDS, EQUIPMENT_KEYWORDS, ORGANIZATION_KEYWORDS, DURATION_PATTERN } from '../data/keywords'
import { buildDiagramFromSessionData } from '../diagram/diagramBuilder.ts'

export function stripAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[\t•]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function detectSection(line: string): string | null {
  const normalized = stripAccents(line).toLowerCase()
  for (const [key, aliases] of Object.entries(SECTION_ALIASES)) {
    const stripped = aliases.map(a => stripAccents(a).toLowerCase())
    if (stripped.some(alias => normalized.startsWith(alias + ':'))) {
      return key
    }
  }
  return null
}

function buildSectionMap(lines: string[]): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  let currentSection: string | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const section = detectSection(trimmed)
    if (section) {
      currentSection = section
      const colonIdx = trimmed.indexOf(':')
      if (colonIdx !== -1) {
        const value = trimmed.substring(colonIdx + 1).trim()
        if (value) {
          if (!map[section]) map[section] = []
          map[section].push(value)
        }
      }
    } else if (currentSection && trimmed) {
      if (!map[currentSection]) map[currentSection] = []
      map[currentSection].push(trimmed)
    }
  }

  return map
}

export function parseCoachText(input: string): BCVBSession {
  const normalized = normalizeText(input)
  const lines = normalized.split('\n')
  const sectionMap = buildSectionMap(lines)

  // Extract fields
  const title = (sectionMap.title?.[0] || 'Séance sans titre').trim()
  const category = (sectionMap.category?.[0] || 'Générale').trim()
  
  const durationMatch = normalized.match(DURATION_PATTERN)
  const durationMin = durationMatch ? parseInt(durationMatch[1], 10) : 45

  const theme = (sectionMap.theme?.[0] || 'Non spécifié').trim()
  const step = detectStep(sectionMap) || 'je découvre'
  const philosophy = (sectionMap.philosophy?.[0] || '').trim()
  const axes = detectAxes(sectionMap)
  const objective = (sectionMap.objective?.[0] || '').trim()
  const intentions = sectionMap.intentions || []
  const organization = (sectionMap.organization?.[0] || '').trim() || detectOrganization(input)
  const equipment = detectEquipment(sectionMap) || []
  const setup = sectionMap.setup || []
  const instructions = sectionMap.instructions || []
  const variables = sectionMap.variables || []
  const successCriteria = sectionMap.successCriteria || []
  const now = new Date().toISOString()

  const session: BCVBSession = {
    id: `session-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    title,
    category,
    durationMin,
    theme,
    step,
    philosophy,
    axes,
    objective,
    intentions,
    organization,
    equipment,
    setup,
    instructions,
    variables,
    successCriteria,
    rawText: input,
    diagram: { courtType: 'half', elements: [], actions: [] },
    metadata: {
      subTheme: '',
      playerCount: null,
      gameFormat: 'non précisé',
      usageLevel: 'formation',
      keywords: []
    },
    sourceImages: [],
    reconstruction: {
      activeSourceImageId: null,
      points: [],
      notes: ''
    }
  }

  session.diagram = buildDiagramFromSessionData(session)
  return session
}

function detectStep(sectionMap: Record<string, string[]>): SessionStep | null {
  const stepText = (sectionMap.step?.[0] || '').toLowerCase()
  if (!stepText) return null
  const normalized = stripAccents(stepText)
  for (const keyword of STEP_KEYWORDS) {
    if (normalized.includes(stripAccents(keyword))) {
      return keyword
    }
  }
  return null
}

function detectAxes(sectionMap: Record<string, string[]>): string[] {
  const axes: string[] = []
  const axeLines = sectionMap.axes || []
  for (const line of axeLines) {
    const normalized = stripAccents(line).toLowerCase()
    for (const axis of ['intensité', 'agressivité', 'maîtrise', 'jeu']) {
      if (normalized.includes(stripAccents(axis).toLowerCase())) {
        if (!axes.includes(axis)) axes.push(axis)
      }
    }
  }
  return axes.length > 0 ? axes : ['intensité', 'agressivité', 'maîtrise', 'jeu']
}

function detectEquipment(sectionMap: Record<string, string[]>): string[] {
  const equipment: string[] = []
  const equipLines = sectionMap.equipment || []
  for (const line of equipLines) {
    const normalized = stripAccents(line).toLowerCase()
    for (const item of EQUIPMENT_KEYWORDS) {
      if (normalized.includes(stripAccents(item).toLowerCase())) {
        if (!equipment.includes(item)) equipment.push(item)
      }
    }
  }
  return equipment
}

function detectOrganization(text: string): string {
  const normalized = stripAccents(text).toLowerCase()
  for (const org of ORGANIZATION_KEYWORDS) {
    if (normalized.includes(stripAccents(org).toLowerCase())) {
      return org
    }
  }
  return 'Non spécifiée'
}

export function parseText(text: string): { session: BCVBSession; errors: string[] } {
  try {
    const session = parseCoachText(text)
    return { session, errors: [] }
  } catch (err) {
    return {
      session: createEmptySession(),
      errors: [err instanceof Error ? err.message : String(err)]
    }
  }
}

function createEmptySession(): BCVBSession {
  const now = new Date().toISOString()

  return {
    id: `session-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    title: 'Nouvelle séance',
    category: 'Générale',
    durationMin: 45,
    theme: '',
    step: 'je découvre',
    philosophy: '',
    axes: ['intensité', 'agressivité', 'maîtrise', 'jeu'],
    objective: '',
    intentions: [],
    organization: '',
    equipment: [],
    setup: [],
    instructions: [],
    variables: [],
    successCriteria: [],
    rawText: '',
    diagram: { courtType: 'half', elements: [], actions: [] },
    metadata: {
      subTheme: '',
      playerCount: null,
      gameFormat: 'non précisé',
      usageLevel: 'formation',
      keywords: []
    },
    sourceImages: [],
    reconstruction: {
      activeSourceImageId: null,
      points: [],
      notes: ''
    }
  }
}
