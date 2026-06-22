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
  to?: EmailRecipient[]
  subject?: string
  htmlContent?: string
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

async function sendBrevoEmail(payload: SendEmailPayload) {
  const apiKey = Deno.env.get('BREVO_API_KEY')
  if (!apiKey) {
    throw new Error('BREVO_API_KEY manquant.')
  }

  const subject = normalizeText(payload.subject)
  const to = (payload.to || [])
    .map((recipient) => ({
      email: normalizeEmail(recipient.email),
      name: normalizeText(recipient.name) || undefined,
    }))
    .filter((recipient) => recipient.email)

  if (!to.length) throw new Error('Aucun destinataire email.')
  if (!subject) throw new Error('Sujet email manquant.')

  const brevoPayload = {
    sender: getSender(),
    to,
    replyTo: getReplyTo(),
    subject,
    htmlContent: normalizeText(payload.htmlContent),
    textContent: normalizeText(payload.textContent),
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(brevoPayload),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Brevo a refusé l'email (${response.status}) : ${detail}`)
  }

  return response.json()
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Méthode non autorisée.' }, 405)
  }

  try {
    const payload = (await request.json()) as SendEmailPayload
    const data = await sendBrevoEmail(payload)

    return jsonResponse({ ok: true, data })
  } catch (error) {
    console.error('[send-bcvb-email] email failed:', error)
    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Erreur email inconnue.',
      },
      500,
    )
  }
})
