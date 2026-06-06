const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function extractClaudeText(payload: any): string {
  return (payload?.content ?? [])
    .map((item: any) => (item?.type === 'text' ? item.text : ''))
    .filter(Boolean)
    .join('\n')
    .trim()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY manquante côté serveur.')

    const body = await req.json()
    const model = body.model || Deno.env.get('ANTHROPIC_MODEL') || 'claude-opus-4-7'
    const system = body.system || 'Tu es un comité éditorial technique du BCVB.'

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: body.maxTokens || 12000,
        temperature: body.temperature ?? 0.4,
        system,
        messages: [
          {
            role: 'user',
            content: body.prompt,
          },
        ],
      }),
    })

    const payload = await response.json()
    if (!response.ok) {
      throw new Error(payload?.error?.message || 'Erreur Anthropic.')
    }

    return new Response(
      JSON.stringify({
        model,
        text: extractClaudeText(payload),
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
