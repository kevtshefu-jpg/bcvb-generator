const TECHNICAL_PATTERNS = [
  /edge function/i,
  /function/i,
  /failed/i,
  /fetch/i,
  /supabase/i,
  /postgres|postgrest|sql|relation|column|schema/i,
  /undefined|null/i,
  /jwt|token|bearer/i,
  /networkerror|typeerror/i,
  /\b\d{3}\b/,
]

function rawMessage(error: unknown) {
  if (!error) return ''
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    return typeof message === 'string' ? message : ''
  }
  return String(error)
}

export function formatUserFacingError(
  error: unknown,
  fallback = 'L’action n’a pas pu aboutir pour le moment. Réessaie dans quelques instants.',
) {
  const message = rawMessage(error).trim()
  if (!message) return fallback
  if (TECHNICAL_PATTERNS.some((pattern) => pattern.test(message))) return fallback
  return message
}

export function getTechnicalErrorDetail(error: unknown) {
  return rawMessage(error).trim()
}
