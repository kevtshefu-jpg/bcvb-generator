const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function extractOpenAiText(payload: any): string {
  if (typeof payload?.output_text === 'string') return payload.output_text

  const parts: string[] = []
  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (typeof content?.text === 'string') parts.push(content.text)
      if (typeof content?.output_text === 'string') parts.push(content.output_text)
    }
  }
  return parts.join('\n').trim()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) throw new Error('OPENAI_API_KEY manquante côté serveur.')

    const body = await req.json()
    const model = body.model || Deno.env.get('OPENAI_MODEL') || 'gpt-5.2'
    const system = body.system || 'Tu es un assistant éditorial BCVB.'

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: 'developer',
            content: system,
          },
          {
            role: 'user',
            content: body.prompt,
          },
        ],
        max_output_tokens: body.maxTokens || 12000,
        temperature: body.temperature ?? 0.4,
      }),
    })

    const payload = await response.json()
    if (!response.ok) {
      throw new Error(payload?.error?.message || 'Erreur OpenAI.')
    }

    return new Response(
      JSON.stringify({
        model,
        text: extractOpenAiText(payload),
        usage: {
          inputTokens: payload?.usage?.input_tokens,
          outputTokens: payload?.usage?.output_tokens,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        text: '',
        error: error instanceof Error ? error.message : 'Erreur inconnue.',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
