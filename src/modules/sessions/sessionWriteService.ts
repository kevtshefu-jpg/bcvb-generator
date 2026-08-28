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

export class SessionWriteConflictError extends Error {
  constructor(message: string) { super(message); this.name = 'SessionWriteConflictError' }
}
export class SessionWriteError extends Error {
  constructor(message: string) { super(message); this.name = 'SessionWriteError' }
}

export function createSessionWriteService(client: SupabaseClient) {
  const reader = createSessionReadService(client)
  const execute = async (name: 'create_session_draft' | 'save_session_draft', args: Record<string, unknown>) => {
    const { data, error } = await client.rpc(name, args)
    if (error?.code === 'PT409') throw new SessionWriteConflictError(error.message)
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
  }
}

const sessionWriteService = createSessionWriteService(supabase)
export const createSessionDraft = sessionWriteService.createSessionDraft
export const saveSessionDraft = sessionWriteService.saveSessionDraft
