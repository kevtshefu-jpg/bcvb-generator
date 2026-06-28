import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { serve } from 'https://deno.land/std/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Méthode non autorisée.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  try {
    await assertAdminCaller(req)
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Accès refusé.',
      }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Function OK',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
