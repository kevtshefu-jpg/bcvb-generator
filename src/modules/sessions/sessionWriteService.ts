import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { createSessionReadService } from './sessionService'

export type SessionDraftPayload = {
  title: string; category: string; level: string; theme: string; sub_theme: string; visibility: 'private' | 'team' | 'club' | 'public'
  duration_minutes: number; expected_players: number; source_type: string; source_file_name: string; source_raw_text: string; source_text: string
  content_json: Record<string, unknown>; quality_score: number
}
export type SessionSituationWriteInput = {
  id?: string; order_index: number; title: string; duration_minutes: number; theme: string; sub_theme: string; pedagogical_phase: string; content_json: Record<string, unknown>
}
export type SessionDraftCreateInput = { teamId: string; coachId: string; session: SessionDraftPayload; situations: SessionSituationWriteInput[]; tags: string[] }
export type SessionDraftSaveInput = { sessionId: string; expectedVersion: number; session: SessionDraftPayload; situations: SessionSituationWriteInput[]; tags: string[] }
export type SessionTransitionInput = { sessionId: string; expectedVersion: number }

export class SessionWriteConflictError extends Error {
  constructor(message: string) { super(message); this.name = 'SessionWriteConflictError' }
}
export class SessionWriteError extends Error {
  constructor(message: string) { super(message); this.name = 'SessionWriteError' }
}
export class SessionTransitionError extends Error {
  constructor(message: string) { super(message); this.name = 'SessionTransitionError' }
}

export function createSessionWriteService(client: SupabaseClient) {
  const reader = createSessionReadService(client)
  const execute = async (name: 'create_session_draft' | 'save_session_draft' | 'submit_session_for_review' | 'publish_session' | 'archive_session' | 'return_session_to_draft', args: Record<string, unknown>, transition = false) => {
    const { data, error } = await client.rpc(name, args)
    if (error?.code === 'PT409') throw new SessionWriteConflictError(error.message)
    if (error && transition) throw new SessionTransitionError(error.message)
    if (error) throw new SessionWriteError('La sauvegarde serveur de la séance a échoué.')
    const id = data && typeof data === 'object' && typeof data.id === 'string' ? data.id : null
    if (!id) throw new SessionWriteError("La séance sauvegardée n'a pas été confirmée par le serveur.")
    return reader.getSessionById(id)
  }
  return {
    createSessionDraft(input: SessionDraftCreateInput) {
      return execute('create_session_draft', { target_team_id: input.teamId, target_coach_id: input.coachId, session_payload: input.session, situations_payload: input.situations, tags_payload: input.tags })
    },
    saveSessionDraft(input: SessionDraftSaveInput) {
      return execute('save_session_draft', { target_session_id: input.sessionId, expected_version: input.expectedVersion, session_payload: input.session, situations_payload: input.situations, tags_payload: input.tags })
    },
    submitSessionForReview(input: SessionTransitionInput) {
      return execute('submit_session_for_review', { target_session_id: input.sessionId, expected_version: input.expectedVersion }, true)
    },
    publishSession(input: SessionTransitionInput) {
      return execute('publish_session', { target_session_id: input.sessionId, expected_version: input.expectedVersion }, true)
    },
    archiveSession(input: SessionTransitionInput) {
      return execute('archive_session', { target_session_id: input.sessionId, expected_version: input.expectedVersion }, true)
    },
    returnSessionToDraft(input: SessionTransitionInput) {
      return execute('return_session_to_draft', { target_session_id: input.sessionId, expected_version: input.expectedVersion }, true)
    },
  }
}

const sessionWriteService = createSessionWriteService(supabase)
export const createSessionDraft = sessionWriteService.createSessionDraft
export const saveSessionDraft = sessionWriteService.saveSessionDraft
export const submitSessionForReview = sessionWriteService.submitSessionForReview
export const publishSession = sessionWriteService.publishSession
export const archiveSession = sessionWriteService.archiveSession
export const returnSessionToDraft = sessionWriteService.returnSessionToDraft
