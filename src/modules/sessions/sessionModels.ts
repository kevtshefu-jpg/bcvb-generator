export const sessionVisibilityOptions = [
  'private',
  'public_technicians',
  'club_reference',
  'archived',
] as const

export const sessionStatusOptions = [
  'draft',
  'to_review',
  'validated',
  'published',
  'archived',
] as const

export const sessionCategories = [
  'U7',
  'U9',
  'U11',
  'U13',
  'U15',
  'U18',
  'U21',
  'Seniors',
  'École de basket',
  'Formation coachs',
  'Section sportive',
] as const

export const sessionThemes = [
  'Motricité',
  'Manipulation ballon',
  'Dribble',
  'Passe',
  'Tir',
  '1c1',
  'Défense Homme à Homme',
  'Aide défensive',
  'Rebond',
  'Jeu rapide',
  'Transition',
  'Lecture de jeu',
  'Spacing',
  'Pick and roll',
  'Jeu sans ballon',
  'Pression défensive',
  'Collectif offensif',
  'Préparation match',
  'Retour au calme',
  'Évaluation',
] as const

export const sessionSubThemes = [
  'Appuis',
  'Arrêts',
  'Changements de rythme',
  'Changements de direction',
  'Main forte',
  'Main faible',
  'Passe et va',
  'Passe et suit',
  'Fixation-passe',
  'Close-out',
  'Orientation défensive',
  'Contain',
  'Aide-reprise',
  'Communication défensive',
  'Repli défensif',
  'Sortie de balle',
  'Relance',
  'Finition près du cercle',
  'Tir en course',
  'Tir extérieur',
  'Lecture avantage',
  'Prise d’information',
] as const

export type SessionVisibility = typeof sessionVisibilityOptions[number]
export type SessionStatus = typeof sessionStatusOptions[number] | 'ready-court' | 'ready-pdf'
export type SessionCategory = typeof sessionCategories[number]
export type SessionType = 'development' | 'preparation-match' | 'evaluation' | 'tournament' | 'recovery'
export type IntensityLevel = 'low' | 'medium' | 'high' | 'game'
export type PedagogicalPhase = 'je-decouvre' | 'je-m-exerce' | 'je-retranscris' | 'je-regule'
export type MetricType = 'count' | 'percentage' | 'duration' | 'rating' | 'text'
export type CourtType = 'full' | 'half' | 'half-left' | 'half-right' | 'half-offense' | 'half-defense' | 'mini'
export type TeamLevel = 'débutant' | 'intermédiaire' | 'confirmé' | 'région' | 'performance'
export type SourceType = 'manual' | 'pasted_text' | 'txt' | 'markdown' | 'pdf' | 'docx' | 'image' | 'library'
export type BcvbAdaptationLevel = 'light' | 'standard' | 'premium'

export type CourtObjectType =
  | 'offense_player'
  | 'defense_player'
  | 'player_offense'
  | 'player_defense'
  | 'cone'
  | 'ball'
  | 'screen'
  | 'coach'
  | 'hands'
  | 'zone'
  | 'text'

export type CourtArrowType = 'arrow_move' | 'arrow_pass' | 'arrow_dribble' | 'arrow_screen'

export type CourtObject = {
  id: string
  type: CourtObjectType
  x: number
  y: number
  label: string
  color?: string
  frameId?: string
  number?: string
  text?: string
  fontSize?: number
}

export type CourtArrow = {
  id: string
  type: CourtArrowType
  fromX: number
  fromY: number
  toX: number
  toY: number
  label?: string
  color?: string
  strokeWidth?: number
  curved?: boolean
  control?: {
    x: number
    y: number
  } | null
}

export type CourtZone = {
  id: string
  x: number
  y: number
  width: number
  height: number
  label: string
  shape?: 'rect' | 'rounded-rect' | 'ellipse' | 'polygon'
  fill?: string
  fillOpacity?: number
  stroke?: string
  strokeWidth?: number
  points?: Array<{ x: number; y: number }>
}

export type SessionMetric = {
  id: string
  label: string
  type: MetricType
  target: string
  observed: string
  unit: string
  notes: string
}

export type SessionCourtFrame = {
  id: string
  title: string
  courtType: CourtType
  intent: string
  showCenterLogo?: boolean
  objects: CourtObject[]
  arrows: CourtArrow[]
  zones: CourtZone[]
  notes: string
}

export type BcvbIdentityLinks = {
  defendreFort: string
  courir: string
  partager: string
  hommeHomme: string
  intensite: string
  agressiviteMaitrisee: string
  maitrise: string
  jeu: string
}

export type SessionSituation = {
  id: string
  order: number
  title: string
  category: string
  subTheme: string
  durationMinutes: number
  theme: string
  intensityLevel: IntensityLevel
  pedagogicalPhase: PedagogicalPhase
  technicalObjective: string
  tacticalObjective: string
  mentalObjective: string
  objective: string
  bcvbObjective: string
  organization: string
  description: string
  instructions: string
  coachCues: string[]
  evolution: string
  regression: string
  adaptationsByLevel: {
    easier: string
    standard: string
    harder: string
  }
  evolutions: string[]
  regressions: string[]
  variables: string[]
  equipment: string[]
  playerCount: string
  space: string
  rotation: string
  timing: string
  oppositionType: string
  security: string
  bcvbLinks: BcvbIdentityLinks
  coachingPoints: string
  expectedSuccessCriteria: string
  observableCriteria: string[]
  measurableCriteria: string[]
  successIndicators: string[]
  successThreshold: string
  evaluationMethod: string
  evaluationNotes: string
  commonMistakes: string[]
  coachCorrections: string[]
  matchTransfer: string
  visibility: SessionVisibility
  status: SessionStatus
  createdBy: string
  ownerId: string
  level: string
  qualityScore: number
  qualityWarnings: string[]
  publishedAt: string
  archivedAt: string
  deletedAt: string
  metrics: SessionMetric[]
  courtFrames: SessionCourtFrame[]
  notes: string
}

export type TrainingSessionV2 = {
  id: string
  title: string
  category: SessionCategory
  subTheme: string
  tags: string[]
  teamId: string
  teamLabel: string
  coachId: string
  coachName: string
  createdBy: string
  ownerId: string
  visibility: SessionVisibility
  status: SessionStatus
  sourceType: SourceType
  sourceFileName: string
  sourceRawText: string
  sourceExtractedText: string
  transformedFromSource: boolean
  bcvbAdaptationLevel: BcvbAdaptationLevel
  date: string
  location: string
  durationMinutes: number
  theme: string
  cycle: string
  season: string
  sessionType: SessionType
  intensityLevel: IntensityLevel
  objectives: string[]
  bcvbObjectives: string[]
  keyFocus: string[]
  equipment: string[]
  expectedPlayers: number
  globalOrganization: string
  sessionFlow: string[]
  notes: string
  summary: string
  evaluationGlobal: string
  coachNotes: string
  adminNotes: string
  qualityScore: number
  qualityWarnings: string[]
  createdAt: string
  updatedAt: string
  publishedAt: string
  archivedAt: string
  deletedAt: string
  deletedBy: string
  situations: SessionSituation[]
  metricsSummary: SessionMetric[]
  observations: {
    whatWorked: string
    toRepeat: string
    nextSessionLink: string
    groupNotes: string
  }
}

export function createId(prefix = 'bcvb') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export const emptyMetric: SessionMetric = {
  id: '',
  label: '',
  type: 'count',
  target: '',
  observed: '',
  unit: '',
  notes: '',
}

export const emptyCourtFrame: SessionCourtFrame = {
  id: '',
  title: '',
  courtType: 'half-right',
  intent: '',
  objects: [],
  arrows: [],
  zones: [],
  notes: '',
}

export const emptyBcvbLinks: BcvbIdentityLinks = {
  defendreFort: '',
  courir: '',
  partager: '',
  hommeHomme: '',
  intensite: '',
  agressiviteMaitrisee: '',
  maitrise: '',
  jeu: '',
}

export const emptySituation: SessionSituation = {
  id: '',
  order: 1,
  title: '',
  category: '',
  subTheme: '',
  durationMinutes: 10,
  theme: '',
  intensityLevel: 'medium',
  pedagogicalPhase: 'je-m-exerce',
  technicalObjective: '',
  tacticalObjective: '',
  mentalObjective: '',
  objective: '',
  bcvbObjective: '',
  organization: '',
  description: '',
  instructions: '',
  coachCues: [],
  evolution: '',
  regression: '',
  adaptationsByLevel: {
    easier: '',
    standard: '',
    harder: '',
  },
  evolutions: [],
  regressions: [],
  variables: [],
  equipment: [],
  playerCount: '',
  space: '',
  rotation: '',
  timing: '',
  oppositionType: '',
  security: '',
  bcvbLinks: emptyBcvbLinks,
  coachingPoints: '',
  expectedSuccessCriteria: '',
  observableCriteria: [],
  measurableCriteria: [],
  successIndicators: [],
  successThreshold: '',
  evaluationMethod: '',
  evaluationNotes: '',
  commonMistakes: [],
  coachCorrections: [],
  matchTransfer: '',
  visibility: 'private',
  status: 'draft',
  createdBy: '',
  ownerId: '',
  level: '',
  qualityScore: 0,
  qualityWarnings: [],
  publishedAt: '',
  archivedAt: '',
  deletedAt: '',
  metrics: [],
  courtFrames: [],
  notes: '',
}

export const emptySession: TrainingSessionV2 = {
  id: '',
  title: '',
  category: 'U13',
  subTheme: '',
  tags: [],
  teamId: '',
  teamLabel: '',
  coachId: '',
  coachName: '',
  createdBy: '',
  ownerId: '',
  visibility: 'private',
  status: 'draft',
  sourceType: 'manual',
  sourceFileName: '',
  sourceRawText: '',
  sourceExtractedText: '',
  transformedFromSource: false,
  bcvbAdaptationLevel: 'standard',
  date: '',
  location: '',
  durationMinutes: 90,
  theme: '',
  cycle: '',
  season: '2025-2026',
  sessionType: 'development',
  intensityLevel: 'medium',
  objectives: [],
  bcvbObjectives: [],
  keyFocus: [],
  equipment: [],
  expectedPlayers: 12,
  globalOrganization: '',
  sessionFlow: [],
  notes: '',
  summary: '',
  evaluationGlobal: '',
  coachNotes: '',
  adminNotes: '',
  qualityScore: 0,
  qualityWarnings: [],
  createdAt: '',
  updatedAt: '',
  publishedAt: '',
  archivedAt: '',
  deletedAt: '',
  deletedBy: '',
  situations: [],
  metricsSummary: [],
  observations: {
    whatWorked: '',
    toRepeat: '',
    nextSessionLink: '',
    groupNotes: '',
  },
}

export function createMetric(input: Partial<SessionMetric> = {}): SessionMetric {
  return { ...emptyMetric, id: createId('metric'), ...input }
}

export function createCourtFrame(input: Partial<SessionCourtFrame> = {}): SessionCourtFrame {
  const frameId = input.id || createId('court')
  return {
    ...emptyCourtFrame,
    ...input,
    id: frameId,
    title: input.title || 'Terrain principal',
    intent: input.intent || 'Mise en place',
    objects: input.objects || [
      { id: createId('obj'), type: 'offense_player', x: 4.5, y: 8.4, label: '1', color: '#b5122b', frameId },
      { id: createId('obj'), type: 'defense_player', x: 5.6, y: 8.4, label: 'D', color: '#2f3438', frameId },
      { id: createId('obj'), type: 'ball', x: 4.2, y: 8.6, label: 'Ballon', color: '#f97316', frameId },
    ],
    arrows: input.arrows || [
      { id: createId('arr'), type: 'arrow_dribble', fromX: 4.5, fromY: 8.4, toX: 7.2, toY: 6.2 },
    ],
    zones: input.zones || [],
  }
}

export function createSituation(input: Partial<SessionSituation> = {}): SessionSituation {
  const normalizedBcvbLinks = normalizeBcvbLinks(input.bcvbLinks)
  const situation = {
    ...emptySituation,
    id: createId('situation'),
    order: input.order ?? 1,
    title: input.title || 'Nouvelle situation',
    metrics: input.metrics || [createMetric({ label: 'Réussites attendues', target: '7', unit: '/10' })],
    courtFrames: input.courtFrames || [createCourtFrame()],
    ...input,
    bcvbLinks: normalizedBcvbLinks,
  }
  return normalizeSituation(situation)
}

export function createSession(input: Partial<TrainingSessionV2> = {}): TrainingSessionV2 {
  const now = new Date().toISOString()
  const session = {
    ...emptySession,
    id: createId('session'),
    title: 'Séance BCVB',
    createdAt: now,
    updatedAt: now,
    ...input,
  }
  return normalizeSession(session)
}

export function normalizeBcvbLinks(value: unknown): BcvbIdentityLinks {
  if (Array.isArray(value)) {
    const text = value.join(' · ')
    return {
      ...emptyBcvbLinks,
      defendreFort: text.includes('Défendre') ? 'Pression, aide et communication défensive.' : '',
      courir: text.includes('Courir') ? 'Relance rapide et disponibilité immédiate.' : '',
      partager: text.includes('Partager') ? 'Choix collectif et balle vivante.' : '',
      hommeHomme: text.includes('Homme') ? 'Responsabilité individuelle en Homme à Homme.' : '',
    }
  }

  if (value && typeof value === 'object') {
    return { ...emptyBcvbLinks, ...(value as Partial<BcvbIdentityLinks>) }
  }

  return { ...emptyBcvbLinks }
}

function normalizeStringList(value: unknown) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string') return value.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean)
  return []
}

export function normalizeSituation(value: Partial<SessionSituation>): SessionSituation {
  const source = { ...emptySituation, ...value }
  const evolution = source.evolution || source.evolutions?.[0] || ''
  const regression = source.regression || source.regressions?.[0] || ''

  return {
    ...source,
    id: source.id || createId('situation'),
    title: source.title || 'Nouvelle situation',
    bcvbLinks: normalizeBcvbLinks(source.bcvbLinks),
    coachCues: normalizeStringList(source.coachCues),
    evolutions: normalizeStringList(source.evolutions),
    regressions: normalizeStringList(source.regressions),
    variables: normalizeStringList(source.variables),
    equipment: normalizeStringList(source.equipment),
    observableCriteria: normalizeStringList(source.observableCriteria),
    measurableCriteria: normalizeStringList(source.measurableCriteria),
    successIndicators: normalizeStringList(source.successIndicators),
    commonMistakes: normalizeStringList(source.commonMistakes),
    coachCorrections: normalizeStringList(source.coachCorrections),
    evolution,
    regression,
    courtFrames: (source.courtFrames?.length ? source.courtFrames : [createCourtFrame()]).map((frame) => ({
      ...emptyCourtFrame,
      ...frame,
      id: frame.id || createId('court'),
      title: frame.title || 'Terrain principal',
      intent: frame.intent || 'Mise en place',
    })),
  }
}

export function normalizeSession(value: Partial<TrainingSessionV2>): TrainingSessionV2 {
  const source = { ...emptySession, ...value }

  return {
    ...source,
    id: source.id || createId('session'),
    category: (sessionCategories.includes(source.category as SessionCategory) ? source.category : 'U13') as SessionCategory,
    status: source.status || 'draft',
    visibility: source.visibility || 'private',
    tags: normalizeStringList(source.tags),
    objectives: normalizeStringList(source.objectives),
    bcvbObjectives: normalizeStringList(source.bcvbObjectives),
    keyFocus: normalizeStringList(source.keyFocus),
    equipment: normalizeStringList(source.equipment),
    sessionFlow: normalizeStringList(source.sessionFlow),
    qualityWarnings: normalizeStringList(source.qualityWarnings),
    situations: (source.situations || []).map(normalizeSituation),
  }
}
