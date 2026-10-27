import { supabase } from '../../../lib/supabase'
import type { PlayerContentUnlockRow } from '../types/unlocks'

export async function fetchPlayerUnlockRows(playerId: string) {
  const { data, error } = await supabase
    .from('player_content_unlocks')
    .select('id, player_id, content_id, unlocked_by, created_at')
    .eq('player_id', playerId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as PlayerContentUnlockRow[]
}

export async function unlockContentForPlayer(playerId: string, contentId: string, unlockedBy?: string) {
  const payload = {
    player_id: playerId,
    content_id: contentId,
    unlocked_by: unlockedBy ?? null,
  }

  // This table deliberately has no UPDATE policy: an upsert with
  // ON CONFLICT DO UPDATE would fail under RLS for existing unlocks.
  // Insert once; treat only a unique-key conflict as an idempotent success
  // after verifying that the existing row is readable to the caller.
  const { data, error } = await supabase
    .from('player_content_unlocks')
    .insert(payload)
    .select('id, player_id, content_id, unlocked_by, created_at')
    .single()

  if (!error) return data as PlayerContentUnlockRow
  if (error.code !== '23505') throw error

  const { data: existing, error: readError } = await supabase
    .from('player_content_unlocks')
    .select('id, player_id, content_id, unlocked_by, created_at')
    .eq('player_id', playerId)
    .eq('content_id', contentId)
    .single()

  if (readError) throw readError
  return existing as PlayerContentUnlockRow
}

export async function lockContentForPlayer(playerId: string, contentId: string) {
  const { error } = await supabase
    .from('player_content_unlocks')
    .delete()
    .eq('player_id', playerId)
    .eq('content_id', contentId)

  if (error) throw error
}

export async function fetchUnlockedContentIds(playerId: string) {
  const rows = await fetchPlayerUnlockRows(playerId)
  return rows.map((row) => row.content_id)
}