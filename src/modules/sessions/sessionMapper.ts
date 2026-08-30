import {
  emptyBcvbLinks,
  type BcvbAdaptationLevel,
  type IntensityLevel,
  type PedagogicalPhase,
  type SessionCategory,
  type SessionCourtFrame,
  type SessionMetric,
  type SessionSituation,
  type SessionStatus,
  type SessionType,
  type SessionVisibility,
  type SourceType,
  type TrainingSessionV2,
} from './sessionModels'

type JsonRecord = Record<string, unknown>

export type SessionRow = {
  id: string; title: string; category: string; level?: string | null; theme: string; sub_theme: string
  team_id: string | null; coach_id: string | null; owner_id: string | null
  visibility: string; status: string; duration_minutes: number; expected_players: number
  source_type: string; source_file_name: string; source_raw_text: string; source_text?: string | null
  content_json: unknown; quality_score: number; created_at: string; updated_at: string
  published_at: string | null; archived_at: string | null; deleted_at: string | null; deleted_by: string | null
  version: number
}

export type SessionSituationRow = {
  id: string; session_id: string; order_index: number; title: string; duration_minutes: number
  theme: string; sub_theme: string; pedagogical_phase: string; content_json: unknown
  created_at: string; updated_at: string
}

export type SituationRow = {
  id: string; session_id: string | null; team_id: string | null; title: string; category: string
  theme: string; sub_theme: string; level: string; duration_minutes: number; player_count: string
  visibility: string; status: string; content_json: unknown; quality_score: number
  created_by: string | null; owner_id: string | null; created_at: string; updated_at: string
  published_at: string | null; archived_at: string | null; deleted_at: string | null; version: number
}

export class SessionMappingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SessionMappingError'
  }
}

function jsonRecord(value: unknown, label: string): JsonRecord {
  if (value === null || value === undefined) return {}
  if (typeof value !== 'object' || Array.isArray(value)) throw new SessionMappingError(`${label} incompatible.`)
  return value as JsonRecord
}

function requiredString(value: unknown, label: string) {
  if (typeof value !== 'string') throw new SessionMappingError(`${label} serveur absent ou incompatible.`)
  return value
}

function requiredNumber(value: unknown, label: string) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new SessionMappingError(`${label} serveur absent ou incompatible.`)
  return value
}

function text(source: JsonRecord, key: string) {
  const value = source[key]
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') throw new SessionMappingError(`content_json.${key} incompatible.`)
  return value
}

function boolean(source: JsonRecord, key: string) {
  const value = source[key]
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'boolean') throw new SessionMappingError(`content_json.${key} incompatible.`)
  return value
}

function optionalText(source: JsonRecord, key: string) {
  const value = source[key]
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'string') throw new SessionMappingError(`content_json.${key} incompatible.`)
  return value
}

function optionalNumber(source: JsonRecord, key: string) {
  const value = source[key]
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new SessionMappingError(`content_json.${key} incompatible.`)
  return value
}

function strings(source: JsonRecord, key: string) {
  const value = source[key]
  if (value === undefined || value === null) return []
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) throw new SessionMappingError(`content_json.${key} incompatible.`)
  return [...value] as string[]
}

function recordsWithIds<T>(source: JsonRecord, key: string): T[] {
  const value = source[key]
  if (value === undefined || value === null) return []
  if (!Array.isArray(value) || value.some((item) => !item || typeof item !== 'object' || Array.isArray(item) || typeof (item as JsonRecord).id !== 'string')) {
    throw new SessionMappingError(`content_json.${key} incompatible ou sans identifiant serveur.`)
  }
  return structuredClone(value) as T[]
}

function observations(source: JsonRecord): TrainingSessionV2['observations'] {
  const value = source.observations
  if (value === undefined || value === null) return { whatWorked: '', toRepeat: '', nextSessionLink: '', groupNotes: '' }
  const record = jsonRecord(value, 'content_json.observations')
  return { whatWorked: text(record, 'whatWorked'), toRepeat: text(record, 'toRepeat'), nextSessionLink: text(record, 'nextSessionLink'), groupNotes: text(record, 'groupNotes') }
}

function adaptations(source: JsonRecord): SessionSituation['adaptationsByLevel'] {
  const value = source.adaptationsByLevel
  if (value === undefined || value === null) return { easier: '', standard: '', harder: '' }
  const record = jsonRecord(value, 'content_json.adaptationsByLevel')
  return { easier: text(record, 'easier'), standard: text(record, 'standard'), harder: text(record, 'harder') }
}

function bcvbLinks(source: JsonRecord): SessionSituation['bcvbLinks'] {
  const value = source.bcvbLinks
  if (value === undefined || value === null) return { ...emptyBcvbLinks }
  const record = jsonRecord(value, 'content_json.bcvbLinks')
  return {
    defendreFort: text(record, 'defendreFort'), courir: text(record, 'courir'), partager: text(record, 'partager'),
    hommeHomme: text(record, 'hommeHomme'), intensite: text(record, 'intensite'),
    agressiviteMaitrisee: text(record, 'agressiviteMaitrisee'), maitrise: text(record, 'maitrise'), jeu: text(record, 'jeu'),
  }
}

function mapSituationContent(content: JsonRecord): Omit<SessionSituation, 'id' | 'order' | 'title' | 'durationMinutes' | 'theme' | 'subTheme' | 'pedagogicalPhase' | 'visibility' | 'status' | 'createdBy' | 'ownerId' | 'level' | 'qualityScore' | 'publishedAt' | 'archivedAt' | 'deletedAt'> {
  return {
    category: text(content, 'category'), intensityLevel: text(content, 'intensityLevel') as IntensityLevel,
    technicalObjective: text(content, 'technicalObjective'), tacticalObjective: text(content, 'tacticalObjective'), mentalObjective: text(content, 'mentalObjective'),
    objective: text(content, 'objective'), bcvbObjective: text(content, 'bcvbObjective'), organization: text(content, 'organization'),
    description: text(content, 'description'), instructions: text(content, 'instructions'), coachCues: strings(content, 'coachCues'),
    evolution: text(content, 'evolution'), regression: text(content, 'regression'), adaptationsByLevel: adaptations(content),
    evolutions: strings(content, 'evolutions'), regressions: strings(content, 'regressions'), variables: strings(content, 'variables'), equipment: strings(content, 'equipment'),
    playerCount: text(content, 'playerCount'), space: text(content, 'space'), rotation: text(content, 'rotation'), timing: text(content, 'timing'),
    oppositionType: text(content, 'oppositionType'), security: text(content, 'security'), bcvbLinks: bcvbLinks(content), coachingPoints: text(content, 'coachingPoints'),
    expectedSuccessCriteria: text(content, 'expectedSuccessCriteria'), observableCriteria: strings(content, 'observableCriteria'), measurableCriteria: strings(content, 'measurableCriteria'),
    successIndicators: strings(content, 'successIndicators'), successThreshold: text(content, 'successThreshold'), evaluationMethod: text(content, 'evaluationMethod'),
    evaluationNotes: text(content, 'evaluationNotes'), commonMistakes: strings(content, 'commonMistakes'), coachCorrections: strings(content, 'coachCorrections'),
    matchTransfer: text(content, 'matchTransfer'), qualityWarnings: strings(content, 'qualityWarnings'), metrics: recordsWithIds<SessionMetric>(content, 'metrics'),
    courtFrames: recordsWithIds<SessionCourtFrame>(content, 'courtFrames'), notes: text(content, 'notes'),
  }
}

export function mapSessionSituationRowToDomain(row: SessionSituationRow): SessionSituation {
  const content = jsonRecord(row.content_json, 'session_situations.content_json')
  return {
    ...mapSituationContent(content), id: requiredString(row.id, 'session_situations.id'), order: requiredNumber(row.order_index, 'session_situations.order_index'),
    title: requiredString(row.title, 'session_situations.title'), durationMinutes: requiredNumber(row.duration_minutes, 'session_situations.duration_minutes'),
    theme: requiredString(row.theme, 'session_situations.theme'), subTheme: requiredString(row.sub_theme, 'session_situations.sub_theme'),
    pedagogicalPhase: requiredString(row.pedagogical_phase, 'session_situations.pedagogical_phase') as PedagogicalPhase,
    visibility: optionalText(content, 'visibility') as SessionVisibility | undefined, status: optionalText(content, 'status') as SessionStatus | undefined,
    createdBy: text(content, 'createdBy'), ownerId: text(content, 'ownerId'), level: text(content, 'level'), qualityScore: optionalNumber(content, 'qualityScore'),
    publishedAt: text(content, 'publishedAt'), archivedAt: text(content, 'archivedAt'), deletedAt: text(content, 'deletedAt'),
    createdAt: requiredString(row.created_at, 'session_situations.created_at'), updatedAt: requiredString(row.updated_at, 'session_situations.updated_at'),
  }
}

export function mapSessionRowToDomain(row: SessionRow, situationRows: SessionSituationRow[] = [], tags: string[] = []): TrainingSessionV2 {
  const content = jsonRecord(row.content_json, 'sessions.content_json')
  return {
    id: requiredString(row.id, 'sessions.id'), title: requiredString(row.title, 'sessions.title'), category: requiredString(row.category, 'sessions.category') as SessionCategory,
    subTheme: requiredString(row.sub_theme, 'sessions.sub_theme'), tags: [...tags], teamId: row.team_id || '', teamLabel: text(content, 'teamLabel'), coachId: row.coach_id || '',
    coachName: text(content, 'coachName'), createdBy: text(content, 'createdBy'), ownerId: row.owner_id || '', visibility: requiredString(row.visibility, 'sessions.visibility') as SessionVisibility,
    status: requiredString(row.status, 'sessions.status') as SessionStatus, sourceType: requiredString(row.source_type, 'sessions.source_type') as SourceType,
    sourceFileName: requiredString(row.source_file_name, 'sessions.source_file_name'), sourceRawText: requiredString(row.source_raw_text, 'sessions.source_raw_text'),
    sourceExtractedText: row.source_text || text(content, 'sourceExtractedText'), transformedFromSource: boolean(content, 'transformedFromSource'),
    bcvbAdaptationLevel: text(content, 'bcvbAdaptationLevel') as BcvbAdaptationLevel, date: text(content, 'date'), location: text(content, 'location'),
    durationMinutes: requiredNumber(row.duration_minutes, 'sessions.duration_minutes'), theme: requiredString(row.theme, 'sessions.theme'), cycle: text(content, 'cycle'), season: text(content, 'season'),
    sessionType: text(content, 'sessionType') as SessionType, intensityLevel: text(content, 'intensityLevel') as IntensityLevel,
    objectives: strings(content, 'objectives'), bcvbObjectives: strings(content, 'bcvbObjectives'), keyFocus: strings(content, 'keyFocus'), equipment: strings(content, 'equipment'),
    expectedPlayers: requiredNumber(row.expected_players, 'sessions.expected_players'), globalOrganization: text(content, 'globalOrganization'), sessionFlow: strings(content, 'sessionFlow'),
    notes: text(content, 'notes'), summary: text(content, 'summary'), evaluationGlobal: text(content, 'evaluationGlobal'), coachNotes: text(content, 'coachNotes'), adminNotes: text(content, 'adminNotes'),
    qualityScore: requiredNumber(row.quality_score, 'sessions.quality_score'), qualityWarnings: strings(content, 'qualityWarnings'),
    createdAt: requiredString(row.created_at, 'sessions.created_at'), updatedAt: requiredString(row.updated_at, 'sessions.updated_at'), publishedAt: row.published_at || '', archivedAt: row.archived_at || '',
    deletedAt: row.deleted_at || '', deletedBy: row.deleted_by || '', situations: [...situationRows].sort((a, b) => a.order_index - b.order_index).map(mapSessionSituationRowToDomain),
    metricsSummary: recordsWithIds<SessionMetric>(content, 'metricsSummary'), observations: observations(content), version: requiredNumber(row.version, 'sessions.version'),
  }
}

export function mapSituationRowToDomain(row: SituationRow): SessionSituation {
  const content = jsonRecord(row.content_json, 'situations.content_json')
  return {
    ...mapSituationContent(content), id: requiredString(row.id, 'situations.id'), order: optionalNumber(content, 'order'),
    title: requiredString(row.title, 'situations.title'), category: requiredString(row.category, 'situations.category'), durationMinutes: requiredNumber(row.duration_minutes, 'situations.duration_minutes'),
    theme: requiredString(row.theme, 'situations.theme'), subTheme: requiredString(row.sub_theme, 'situations.sub_theme'), pedagogicalPhase: text(content, 'pedagogicalPhase') as PedagogicalPhase,
    playerCount: requiredString(row.player_count, 'situations.player_count'), visibility: requiredString(row.visibility, 'situations.visibility') as SessionVisibility,
    status: requiredString(row.status, 'situations.status') as SessionStatus, createdBy: row.created_by || '', ownerId: row.owner_id || '', level: requiredString(row.level, 'situations.level'),
    qualityScore: requiredNumber(row.quality_score, 'situations.quality_score'), publishedAt: row.published_at || '', archivedAt: row.archived_at || '', deletedAt: row.deleted_at || '',
    createdAt: requiredString(row.created_at, 'situations.created_at'), updatedAt: requiredString(row.updated_at, 'situations.updated_at'), version: requiredNumber(row.version, 'situations.version'),
  }
}
