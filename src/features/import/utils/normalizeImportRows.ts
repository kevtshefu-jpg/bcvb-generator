export type NormalizedImportRow = {
  raw_data: Record<string, unknown>
  normalized_first_name?: string | null
  normalized_last_name?: string | null
  normalized_email?: string | null
  normalized_phone?: string | null
  normalized_birth_year?: number | null
  normalized_category_id?: string | null
  normalized_team?: string | null
  normalized_license_number?: string | null
  normalized_notes?: string | null
  status?: string
}

type GenericRow = Record<string, unknown>

function cleanString(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function normalizeEmail(value: unknown) {
  const email = cleanString(value).toLowerCase()
  return email || null
}

function normalizePhone(value: unknown) {
  const phone = cleanString(value)
    .replace(/\s+/g, '')
    .replace(/\./g, '')
  return phone || null
}

function normalizeBirthYear(value: unknown) {
  const raw = cleanString(value)
  if (!raw) return null
  const year = Number(raw)
  if (Number.isNaN(year) || year < 1900 || year > 2100) return null
  return year
}

function normalizeCategory(value: unknown) {
  const raw = cleanString(value).toUpperCase()
  if (!raw) return null
  if (raw.includes('U7')) return 'U7'
  if (raw.includes('U9')) return 'U9'
  if (raw.includes('U11')) return 'U11'
  if (raw.includes('U13')) return 'U13'
  if (raw.includes('U15')) return 'U15'
  if (raw.includes('U18')) return 'U18'
  if (raw.includes('SENIOR')) return 'Seniors'
  return raw
}

function findValue(row: GenericRow, keys: string[]) {
  const entries = Object.entries(row)
  for (const key of keys) {
    const found = entries.find(([entryKey]) => entryKey.toLowerCase() === key.toLowerCase())
    if (found) return found[1]
  }
  return undefined
}

export function normalizeRow(row: GenericRow): NormalizedImportRow {
  const firstName = findValue(row, ['prenom', 'prénom', 'first_name', 'firstname', 'first name'])
  const lastName = findValue(row, ['nom', 'last_name', 'lastname', 'last name'])
  const email = findValue(row, ['email', 'mail', 'e-mail'])
  const phone = findValue(row, ['telephone', 'téléphone', 'phone', 'mobile', 'portable'])
  const birthYear = findValue(row, ['annee_naissance', 'année_naissance', 'annee', 'année', 'birth_year'])
  const category = findValue(row, ['categorie', 'catégorie', 'category', 'categorie_demandee'])
  const team = findValue(row, ['equipe', 'équipe', 'team'])
  const licenseNumber = findValue(row, ['numero_licence', 'n_licence', 'licence'])
  const notes = findValue(row, ['notes', 'note', 'commentaire', 'commentaires'])

  return {
    raw_data: row,
    normalized_first_name: cleanString(firstName) || null,
    normalized_last_name: cleanString(lastName) || null,
    normalized_email: normalizeEmail(email),
    normalized_phone: normalizePhone(phone),
    normalized_birth_year: normalizeBirthYear(birthYear),
    normalized_category_id: normalizeCategory(category),
    normalized_team: cleanString(team) || null,
    normalized_license_number: cleanString(licenseNumber) || null,
    normalized_notes: cleanString(notes) || null,
    status: 'pending',
  }
}