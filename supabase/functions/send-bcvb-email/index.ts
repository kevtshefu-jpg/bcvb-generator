import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type EmailRecipient = {
  email: string
  name?: string | null
}

type SendEmailPayload = {
  to?: unknown
  subject?: string
  html?: string
  htmlContent?: string
  text?: string
  textContent?: string
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

async function assertTrustedEmailCaller(request: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const token = getBearerToken(request)

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Configuration Supabase incomplète pour vérifier l’appel email.')
  }

  if (!token) {
    throw new Error('Session requise pour envoyer un email.')
  }

  if (token === serviceRoleKey) return

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

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
    throw new Error(`Impossible de vérifier les droits email : ${profileError.message}`)
  }

  if (!profile || profile.is_active === false || !isAdminRole(profile.role)) {
    throw new Error('Droits insuffisants pour envoyer un email serveur.')
  }
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
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
    Deno.env.get('EMAIL_FROM') || 'BCVB Référentiel <kevtshefu@gmail.com>',
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

function normalizeRecipient(input: unknown) {
  if (typeof input === 'string') {
    const email = normalizeEmail(input)
    if (!isValidEmail(email)) return null

    return { email }
  }

  if (input && typeof input === 'object') {
    const recipient = input as EmailRecipient
    const email = normalizeEmail(recipient.email)
    if (!isValidEmail(email)) return null

    return {
      email,
      name: normalizeText(recipient.name) || undefined,
    }
  }

  return null
}

function normalizeRecipients(input: unknown) {
  const values = Array.isArray(input) ? input : [input]

  return values
    .map((recipient) => normalizeRecipient(recipient))
    .filter((recipient): recipient is { email: string; name?: string } => Boolean(recipient))
}

function stripHtml(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim()
}

function normalizeEmailContent(payload: SendEmailPayload) {
  const htmlContent = normalizeText(payload.htmlContent) || normalizeText(payload.html)
  const textContent =
    normalizeText(payload.textContent) ||
    normalizeText(payload.text) ||
    stripHtml(htmlContent)

  return {
    htmlContent,
    textContent,
  }
}

async function readBrevoResponse(response: Response) {
  const raw = await response.text()

  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

async function sendBrevoEmail(payload: SendEmailPayload) {
  const apiKey = Deno.env.get('BREVO_API_KEY')
  if (!apiKey) {
    throw new Error('BREVO_API_KEY manquant.')
  }

  const subject = normalizeText(payload.subject)
  const to = normalizeRecipients(payload.to)
  const content = normalizeEmailContent(payload)
  const sender = getSender()

  if (!to.length) throw new Error('Aucun destinataire email.')
  if (!subject) throw new Error('Sujet email manquant.')
  if (!content.htmlContent) throw new Error('Contenu HTML email manquant.')

  const brevoPayload = {
    sender,
    to,
    replyTo: getReplyTo(),
    subject,
    htmlContent: content.htmlContent,
    textContent: content.textContent,
  }

  console.info('[send-bcvb-email] sending email:', {
    provider: 'brevo',
    subject,
    recipientsCount: to.length,
    hasHtmlContent: Boolean(content.htmlContent),
    hasTextContent: Boolean(content.textContent),
    sender,
  })

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(brevoPayload),
  })

  const brevoResponse = await readBrevoResponse(response)

  console.info('[send-bcvb-email] Brevo response:', {
    provider: 'brevo',
    subject,
    recipientsCount: to.length,
    hasHtmlContent: Boolean(content.htmlContent),
    hasTextContent: Boolean(content.textContent),
    sender,
    brevoStatus: response.status,
    brevoResponseBody: brevoResponse,
  })

  if (!response.ok) {
    throw new Error(
      `Brevo a refusé l'email (${response.status}) : ${JSON.stringify(brevoResponse)}`,
    )
  }

  return brevoResponse
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Méthode non autorisée.' }, 405)
  }

  try {
    await assertTrustedEmailCaller(request)
    const payload = (await request.json()) as SendEmailPayload
    const data = await sendBrevoEmail(payload)

    return jsonResponse({ ok: true, data })
  } catch (error) {
    console.error('[send-bcvb-email] email failed:', error)
    const message = error instanceof Error ? error.message : 'Erreur email inconnue.'
    const status =
      message.toLowerCase().includes('session') || message.toLowerCase().includes('droits')
        ? 403
        : 500

    return jsonResponse(
      {
        ok: false,
        error: message,
      },
      status,
    )
  }
})
