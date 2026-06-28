import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function normalizeText(value: unknown) {
  return String(value || '').trim()
}

function normalizeRole(value: unknown) {
  const role = normalizeText(value).toLowerCase()
  if (role === 'technical_manager') return 'responsable_technique'
  if (role === 'membre') return 'member'
  return role || 'member'
}

function isAdminRole(value: unknown) {
  return ['admin', 'responsable_technique'].includes(normalizeRole(value))
}

async function assertAdminCaller(req: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const token = normalizeText(req.headers.get('Authorization')).replace(/^Bearer\s+/i, '')

  if (!supabaseUrl || !serviceRoleKey) throw new Error('Configuration Supabase incomplète.')
  if (!token) throw new Error('Session admin manquante.')

  if (token === serviceRoleKey) return

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
  if (userError || !userData.user) throw new Error('Session invalide ou expirée.')

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', userData.user.id)
    .maybeSingle()

  if (profileError) throw new Error(`Impossible de vérifier les droits admin : ${profileError.message}`)
  if (!profile || profile.is_active === false || !isAdminRole(profile.role)) {
    throw new Error('Droits administrateur insuffisants.')
  }
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
    await assertAdminCaller(req)
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
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status =
      message.toLowerCase().includes('session') || message.toLowerCase().includes('droits')
        ? 403
        : 400

    return new Response(
      JSON.stringify({
        text: '',
        error: message,
      }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
