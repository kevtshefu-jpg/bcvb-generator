import { supabase } from '../../../lib/supabase'

export type AIExpertModeRow = {
  id: string
  mode_key: string
  label: string
  description: string | null
  is_active: boolean
  is_default: boolean
  sort_order: number
}

export async function fetchAIExpertModes(): Promise<AIExpertModeRow[]> {
  const { data, error } = await supabase
    .from('ai_expert_modes')
    .select('id, mode_key, label, description, is_active, is_default, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw error

  return (data ?? []) as AIExpertModeRow[]
}