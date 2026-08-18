import { supabase } from '../../lib/supabase'
import { isAdmin } from '../../config/roles'

export type OperationalTeam = { id: string; name: string; category: string; season: string }
export type TrainingSlot = { id: string; team_id: string; season: string; weekday: number; start_time: string; end_time: string; location_name: string | null; valid_from: string; valid_until: string | null; is_active: boolean; team?: OperationalTeam | null }
export type SlotConflict = { id: string; team_id: string; team_name: string; start_time: string; end_time: string; location_name: string }
export type SlotInput = Omit<TrainingSlot, 'id' | 'is_active' | 'team'> & { id?: string }

export function canManageOperationalPlanning(role?: string | null) {
  return isAdmin(role)
}

export async function loadOperationalPlanning() {
  const [slots, teams] = await Promise.all([
    supabase.from('training_slots').select('id, team_id, season, weekday, start_time, end_time, location_name, valid_from, valid_until, is_active, team:teams(id,name,category,season)').eq('is_active', true).order('weekday').order('start_time'),
    supabase.from('teams').select('id,name,category,season').is('archived_at', null).order('category').order('name'),
  ])
  if (slots.error) throw new Error(slots.error.message)
  if (teams.error) throw new Error(teams.error.message)
  return { slots: (slots.data || []) as unknown as TrainingSlot[], teams: (teams.data || []) as OperationalTeam[] }
}

export async function saveTrainingSlot(input: SlotInput, allowConflict = false): Promise<{ conflicts: SlotConflict[] }> {
  const { data, error } = await supabase.rpc('save_training_slot', {
    target_slot_id: input.id || null, target_team_id: input.team_id, target_season: input.season,
    target_weekday: input.weekday, target_start_time: input.start_time, target_end_time: input.end_time,
    target_location_name: input.location_name || null, target_valid_from: input.valid_from,
    target_valid_until: input.valid_until || null, allow_conflict: allowConflict,
  })
  if (error) throw new Error(error.message)
  if (data?.ok === false && data?.code === 'SLOT_CONFLICT') return { conflicts: data.conflicts || [] }
  if (!data?.ok || !data.slot_id) throw new Error('L’enregistrement n’a pas été confirmé par le serveur.')
  return { conflicts: data.conflicts || [] }
}

export async function deactivateTrainingSlot(id: string) {
  const { data, error } = await supabase.rpc('deactivate_training_slot', { target_slot_id: id })
  if (error) throw new Error(error.message)
  if (!data?.ok || data.slot_id !== id) throw new Error('La désactivation n’a pas été confirmée par le serveur.')
}

export function slotsConflict(a: Pick<TrainingSlot, 'weekday'|'start_time'|'end_time'|'location_name'|'valid_from'|'valid_until'>, b: Pick<TrainingSlot, 'weekday'|'start_time'|'end_time'|'location_name'|'valid_from'|'valid_until'>) {
  if (!a.location_name?.trim() || !b.location_name?.trim()) return false
  const periodsOverlap = (a.valid_until || '9999-12-31') >= b.valid_from && (b.valid_until || '9999-12-31') >= a.valid_from
  return a.weekday === b.weekday && a.location_name.trim().toLocaleLowerCase('fr') === b.location_name.trim().toLocaleLowerCase('fr') && a.start_time < b.end_time && a.end_time > b.start_time && periodsOverlap
}
