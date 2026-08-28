import type { SessionDraftPayload, SessionSituationWriteInput } from './sessionWriteService'
import type { SessionSituation, TrainingSessionV2 } from './sessionModels'

export type SessionBuilderSyncState =
  | 'local_only'
  | 'dirty'
  | 'saving'
  | 'saved'
  | 'conflict'
  | 'error'
  | 'submitted'
  | 'loading'

export type SessionBuilderWritePayload = {
  session: SessionDraftPayload
  situations: SessionSituationWriteInput[]
  tags: string[]
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function hasPersistentUuid(value: string) {
  return UUID_PATTERN.test(value)
}

export function ensurePersistentSituationIds(
  session: TrainingSessionV2,
  createUuid: () => string = () => crypto.randomUUID(),
): TrainingSessionV2 {
  return {
    ...session,
    situations: session.situations.map((situation) =>
      hasPersistentUuid(situation.id) ? situation : { ...situation, id: createUuid() },
    ),
  }
}

function situationContent(situation: SessionSituation): Record<string, unknown> {
  const {
    id: _id,
    order: _order,
    title: _title,
    durationMinutes: _durationMinutes,
    theme: _theme,
    subTheme: _subTheme,
    pedagogicalPhase: _pedagogicalPhase,
    ...content
  } = situation
  return content
}

export function mapBuilderSessionToWritePayload(session: TrainingSessionV2): SessionBuilderWritePayload {
  const {
    id: _id,
    situations,
    tags,
    title,
    category,
    theme,
    subTheme,
    visibility,
    durationMinutes,
    expectedPlayers,
    sourceType,
    sourceFileName,
    sourceRawText,
    sourceExtractedText,
    qualityScore,
    ...content
  } = session

  if (!['private', 'team', 'club', 'public'].includes(visibility)) {
    throw new Error('La visibilité de ce brouillon local doit être choisie avant sa sauvegarde sur BCVB.')
  }

  return {
    session: {
      title,
      category,
      level: '',
      theme,
      sub_theme: subTheme,
      visibility: visibility as SessionDraftPayload['visibility'],
      duration_minutes: durationMinutes,
      expected_players: expectedPlayers,
      source_type: sourceType,
      source_file_name: sourceFileName,
      source_raw_text: sourceRawText,
      source_text: sourceExtractedText,
      content_json: content,
      quality_score: qualityScore,
    },
    situations: situations.map((situation, index) => ({
      id: situation.id,
      order_index: situation.order ?? index + 1,
      title: situation.title,
      duration_minutes: situation.durationMinutes,
      theme: situation.theme,
      sub_theme: situation.subTheme,
      pedagogical_phase: situation.pedagogicalPhase,
      content_json: situationContent(situation),
    })),
    tags: [...tags],
  }
}

export function syncStateAfterEdit(state: SessionBuilderSyncState): SessionBuilderSyncState {
  if (state === 'local_only') return 'local_only'
  if (state === 'conflict') return 'conflict'
  return 'dirty'
}

export function isServerSavedState(state: SessionBuilderSyncState) {
  return state === 'saved' || state === 'submitted'
}
