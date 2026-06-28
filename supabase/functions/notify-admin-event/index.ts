import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const EMAIL_EVENT_TYPES = new Set([
  'registration_created',
  'registration_request_created',
  'registration_approved',
  'registration_rejected',
  'profile_request_created',
  'authorization_requested',
  'document_deleted',
  'document_archived',
  'import_failed',
])

type AdminEventPayload = {
  eventType?: string
  title?: string
  message?: string
  actionUrl?: string | null
  metadata?: Record<string, unknown>
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function normalizeText(value: unknown) {
  return String(value || '').trim()
}

function normalizeEmail(value: unknown) {
  return normalizeText(value).toLowerCase()
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

function getBearerToken(request: Request) {
  return normalizeText(request.headers.get('Authorization')).replace(/^Bearer\s+/i, '')
}

async function assertAdminCaller(
  supabaseAdmin: ReturnType<typeof createClient>,
  request: Request,
  serviceRoleKey: string,
) {
  const token = getBearerToken(request)

  if (!token) {
    throw new Error('Session admin manquante.')
  }

  if (token === serviceRoleKey) return

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)

  if (userError || !userData.user) {
    throw new Error('Session invalide ou expirée.')
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', userData.user.id)
    .maybeSingle()

  if (profileError) {
    throw new Error(`Impossible de vérifier les droits admin : ${profileError.message}`)
  }

  if (!profile || profile.is_active === false || !isAdminRole(profile.role)) {
    throw new Error('Droits administrateur insuffisants.')
  }
}

function parseEmailFrom(value?: string | null) {
  const fallback = {
    name: 'BCVB Référentiel',
    email: 'kevtshefu@gmail.com',
  }
  const raw = normalizeText(value)
  if (!raw) return fallback

  const bracketMatch = raw.match(/^(.*?)<([^<>@\s]+@[^<>@\s]+)>$/)
  if (bracketMatch) {
    return {
      name: normalizeText(bracketMatch[1]) || fallback.name,
      email: normalizeEmail(bracketMatch[2]) || fallback.email,
    }
  }

  const emailMatch = raw.match(/([^\s<>@]+@[^\s<>@]+)$/)
  if (!emailMatch) return fallback

  return {
    name: normalizeText(raw.slice(0, emailMatch.index).replace(/[<>]/g, '')) || fallback.name,
    email: normalizeEmail(emailMatch[1]) || fallback.email,
  }
}

function getSender() {
  return parseEmailFrom(
    Deno.env.get('EMAIL_FROM') || 'BCVB Référentiel kevtshefu@gmail.com',
  )
}

function getReplyTo() {
  const replyToEmail =
    normalizeEmail(Deno.env.get('REPLY_TO_EMAIL')) ||
    normalizeEmail(Deno.env.get('ADMIN_NOTIFICATION_EMAIL')) ||
    'kevtshefu@gmail.com'

  return {
    name: 'Kevin Tshefu',
    email: replyToEmail,
  }
}

function getAdminEmail() {
  return normalizeEmail(Deno.env.get('ADMIN_NOTIFICATION_EMAIL')) || 'kevtshefu@gmail.com'
}

function getSiteUrl() {
  return (
    normalizeText(Deno.env.get('SITE_URL')) ||
    normalizeText(Deno.env.get('PUBLIC_SITE_URL')) ||
    'https://bcvb-generator-ds72.vercel.app'
  ).replace(/\/+$/, '')
}

async function getPreference(
  supabaseAdmin: ReturnType<typeof createClient>,
  eventType: string,
) {
  const candidates =
    eventType === 'registration_created'
      ? ['registration_created', 'registration_request_created']
      : [eventType]

  for (const candidate of candidates) {
    const { data, error } = await supabaseAdmin
      .from('admin_notification_preferences')
      .select('enabled, notify_admin')
      .eq('event_type', candidate)
      .maybeSingle()

    if (!error && data) return data as { enabled?: boolean | null; notify_admin?: boolean | null }

    if (error) {
      console.warn('[notify-admin-event] preference skipped:', error.message)
    }
  }

  return null
}

async function sendBrevoEmail(input: {
  subject: string
  htmlContent: string
  textContent: string
}) {
  const apiKey = Deno.env.get('BREVO_API_KEY')
  if (!apiKey) throw new Error('BREVO_API_KEY manquant.')

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: getSender(),
      to: [{ email: getAdminEmail(), name: 'Kevin Tshefu' }],
      replyTo: getReplyTo(),
      subject: input.subject,
      htmlContent: input.htmlContent,
      textContent: input.textContent,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Brevo a refusé l'email (${response.status}) : ${detail}`)
  }

  return response.json()
}

async function logEmailEvent(
  supabaseAdmin: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  try {
    const { error } = await supabaseAdmin.from('email_events').insert(payload)
    if (error) console.warn('[notify-admin-event] email_events skipped:', error.message)
  } catch (error) {
    console.warn('[notify-admin-event] email_events unavailable:', error)
  }
}

function buildEmail(payload: AdminEventPayload) {
  const title = normalizeText(payload.title) || 'Alerte admin BCVB'
  const message = normalizeText(payload.message) || 'Un événement admin nécessite une vérification.'
  const actionPath = normalizeText(payload.actionUrl)
  const actionUrl = actionPath
    ? actionPath.startsWith('http')
      ? actionPath
      : `${getSiteUrl()}${actionPath.startsWith('/') ? actionPath : `/${actionPath}`}`
    : getSiteUrl()

  return {
    subject: `BCVB — ${title}`,
    htmlContent: `
      <p>${message}</p>
      <p><strong>Type :</strong> ${normalizeText(payload.eventType)}</p>
      <p><a href="${actionUrl}">Ouvrir dans BCVB Référentiel</a></p>
    `,
    textContent: [
      message,
      '',
      `Type : ${normalizeText(payload.eventType)}`,
      `Lien : ${actionUrl}`,
    ].join('\n'),
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Méthode non autorisée.' }, 405)
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ ok: true, skipped: true, warning: 'Configuration Supabase absente.' })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    try {
      await assertAdminCaller(supabaseAdmin, request, serviceRoleKey)
    } catch (error) {
      console.warn('[notify-admin-event] access denied:', error)
      return jsonResponse(
        {
          ok: false,
          error: error instanceof Error ? error.message : 'Accès refusé.',
        },
        403,
      )
    }

    const payload = (await request.json()) as AdminEventPayload
    const eventType = normalizeText(payload.eventType)

    if (!EMAIL_EVENT_TYPES.has(eventType)) {
      return jsonResponse({ ok: true, skipped: true, reason: 'event_not_emailed' })
    }

    const preference = await getPreference(supabaseAdmin, eventType)
    if (preference && (preference.enabled === false || preference.notify_admin === false)) {
      return jsonResponse({ ok: true, skipped: true, reason: 'preference_disabled' })
    }

    const email = buildEmail({ ...payload, eventType })

    try {
      await sendBrevoEmail(email)
      await logEmailEvent(supabaseAdmin, {
        event_type: eventType,
        recipient_email: getAdminEmail(),
        status: 'sent',
        metadata: payload.metadata || {},
      })

      return jsonResponse({ ok: true, skipped: false })
    } catch (error) {
      console.error('[notify-admin-event] email failed:', error)
      await logEmailEvent(supabaseAdmin, {
        event_type: eventType,
        recipient_email: getAdminEmail(),
        status: 'failed',
        error_message: error instanceof Error ? error.message : String(error),
        metadata: payload.metadata || {},
      })

      return jsonResponse({ ok: true, skipped: false, email_sent: false })
    }
  } catch (error) {
    console.error('[notify-admin-event] unexpected failure:', error)
    return jsonResponse({ ok: true, skipped: true, warning: 'Notification email ignorée.' })
  }
})
