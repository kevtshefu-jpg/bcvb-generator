import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type RegistrationNotificationPayload = {
  registrationRequestId?: string
  email?: string
  firstName?: string
  lastName?: string
  fullName?: string
  roleRequested?: string
  categoryRequested?: string
  requestedTeam?: string | null
  phone?: string | null
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

async function sendBrevoEmail(input: {
  to: Array<{ email: string; name?: string }>
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
      to: input.to,
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
  supabaseAdmin: ReturnType<typeof createClient> | null,
  payload: Record<string, unknown>,
) {
  if (!supabaseAdmin) return

  try {
    const { error } = await supabaseAdmin.from('email_events').insert(payload)
    if (error) console.warn('[notify-registration-created] email_events skipped:', error.message)
  } catch (error) {
    console.warn('[notify-registration-created] email_events unavailable:', error)
  }
}

function buildFullName(payload: RegistrationNotificationPayload) {
  return (
    normalizeText(payload.fullName) ||
    `${normalizeText(payload.firstName)} ${normalizeText(payload.lastName)}`.trim() ||
    normalizeEmail(payload.email) ||
    'Membre BCVB'
  )
}

function buildApplicantEmail(payload: RegistrationNotificationPayload) {
  const fullName = buildFullName(payload)

  return {
    subject: 'BCVB — Votre demande d’accès a bien été reçue',
    htmlContent: `
      <p>Bonjour ${fullName},</p>
      <p>Votre demande d’accès au référentiel BCVB a bien été reçue.</p>
      <p>Un responsable du club va l’étudier. Si elle est validée, vous recevrez un email sécurisé pour créer votre mot de passe.</p>
      <p>À bientôt,<br>BCVB Référentiel</p>
    `,
    textContent: [
      `Bonjour ${fullName},`,
      '',
      'Votre demande d’accès au référentiel BCVB a bien été reçue.',
      'Un responsable du club va l’étudier. Si elle est validée, vous recevrez un email sécurisé pour créer votre mot de passe.',
      '',
      'À bientôt,',
      'BCVB Référentiel',
    ].join('\n'),
  }
}

function buildAdminEmail(payload: RegistrationNotificationPayload) {
  const fullName = buildFullName(payload)
  const adminUrl = `${getSiteUrl()}/admin/inscriptions`

  return {
    subject: 'BCVB — Nouvelle demande d’inscription',
    htmlContent: `
      <p>Nouvelle demande d’inscription BCVB.</p>
      <ul>
        <li><strong>Nom :</strong> ${fullName}</li>
        <li><strong>Email :</strong> ${normalizeEmail(payload.email)}</li>
        <li><strong>Rôle demandé :</strong> ${normalizeText(payload.roleRequested) || 'Non précisé'}</li>
        <li><strong>Catégorie :</strong> ${normalizeText(payload.categoryRequested) || 'Non précisée'}</li>
        <li><strong>Équipe :</strong> ${normalizeText(payload.requestedTeam) || 'Non précisée'}</li>
      </ul>
      <p><a href="${adminUrl}">Ouvrir les inscriptions admin</a></p>
    `,
    textContent: [
      'Nouvelle demande d’inscription BCVB.',
      '',
      `Nom : ${fullName}`,
      `Email : ${normalizeEmail(payload.email)}`,
      `Rôle demandé : ${normalizeText(payload.roleRequested) || 'Non précisé'}`,
      `Catégorie : ${normalizeText(payload.categoryRequested) || 'Non précisée'}`,
      `Équipe : ${normalizeText(payload.requestedTeam) || 'Non précisée'}`,
      '',
      `Admin : ${adminUrl}`,
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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const supabaseAdmin =
    supabaseUrl && serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : null

  const results: Record<string, unknown> = {}

  try {
    const payload = (await request.json()) as RegistrationNotificationPayload
    const applicantEmail = normalizeEmail(payload.email)
    const fullName = buildFullName(payload)

    if (!applicantEmail) {
      return jsonResponse({ ok: false, error: 'Email demandeur manquant.' }, 400)
    }

    try {
      const applicant = buildApplicantEmail(payload)
      await sendBrevoEmail({
        to: [{ email: applicantEmail, name: fullName }],
        ...applicant,
      })
      results.applicant = 'sent'
      await logEmailEvent(supabaseAdmin, {
        event_type: 'registration_created_applicant',
        recipient_email: applicantEmail,
        status: 'sent',
        registration_request_id: normalizeText(payload.registrationRequestId) || null,
      })
    } catch (error) {
      console.error('[notify-registration-created] applicant email failed:', error)
      results.applicant = 'failed'
      await logEmailEvent(supabaseAdmin, {
        event_type: 'registration_created_applicant',
        recipient_email: applicantEmail,
        status: 'failed',
        error_message: error instanceof Error ? error.message : String(error),
        registration_request_id: normalizeText(payload.registrationRequestId) || null,
      })
    }

    try {
      const admin = buildAdminEmail(payload)
      await sendBrevoEmail({
        to: [{ email: getAdminEmail(), name: 'Kevin Tshefu' }],
        ...admin,
      })
      results.admin = 'sent'
      await logEmailEvent(supabaseAdmin, {
        event_type: 'registration_created_admin',
        recipient_email: getAdminEmail(),
        status: 'sent',
        registration_request_id: normalizeText(payload.registrationRequestId) || null,
      })
    } catch (error) {
      console.error('[notify-registration-created] admin email failed:', error)
      results.admin = 'failed'
      await logEmailEvent(supabaseAdmin, {
        event_type: 'registration_created_admin',
        recipient_email: getAdminEmail(),
        status: 'failed',
        error_message: error instanceof Error ? error.message : String(error),
        registration_request_id: normalizeText(payload.registrationRequestId) || null,
      })
    }

    return jsonResponse({ ok: true, results })
  } catch (error) {
    console.error('[notify-registration-created] unexpected failure:', error)
    return jsonResponse({ ok: true, warning: 'Notification email ignorée.', results })
  }
})
