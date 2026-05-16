import { supabase } from '../../../lib/supabase'

export async function generateAIDocument(requestId: string) {
  const { data, error } = await supabase.functions.invoke('generate-ai-document', {
    body: {
      requestId,
    },
  })

  if (error) {
    throw error
  }

  return data
}