import { supabase } from '../../../lib/supabase'

export async function fetchAIResults() {
  const { data, error } = await supabase
    .from('document_ai_results')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  return data ?? []
}