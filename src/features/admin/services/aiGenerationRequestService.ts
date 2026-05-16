import { supabase } from '../../../lib/supabase'

export type CreateAIGenerationRequestInput = {
  document_id: string
  requested_by?: string | null
  generation_type: string
  target_audience?: string | null
  options_json: Record<string, boolean>
}

export async function createAIGenerationRequest(input: CreateAIGenerationRequestInput) {
  const { data, error } = await supabase
    .from('document_ai_generation_requests')
    .insert({
      document_id: input.document_id,
      requested_by: input.requested_by ?? null,
      generation_type: input.generation_type,
      target_audience: input.target_audience ?? 'coach',
      options_json: input.options_json,
      status: 'pending',
    })
    .select('*')
    .single()

  if (error) throw error

  return data
}