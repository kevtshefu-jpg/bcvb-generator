import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type { ImportRowInsert } from '../services/importService'

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
  if (Number.isNaN(year)) return null
  if (year < 1900 || year > 2100) return null
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

  return raw || null
}

function findValue(row: GenericRow, keys: string[]) {
  const entries = Object.entries(row)
  for (const key of keys) {
    const found = entries.find(([entryKey]) => entryKey.toLowerCase() === key.toLowerCase())
    if (found) return found[1]
  }
  return undefined
}

function normalizeRow(row: GenericRow): ImportRowInsert {
  const firstName = findValue(row, ['prenom', 'prénom', 'first_name', 'firstname', 'first name'])
  const lastName = findValue(row, ['nom', 'last_name', 'lastname', 'last name'])
  const email = findValue(row, ['email', 'mail', 'e-mail'])
  const phone = findValue(row, ['telephone', 'téléphone', 'phone', 'mobile', 'portable'])
  const birthYear = findValue(row, [
    'annee',
    'année',
    'birth_year',
    'annee_naissance',
    'année_naissance',
    'naissance',
  ])
  const category = findValue(row, ['categorie', 'catégorie', 'category', 'team', 'equipe', 'équipe'])

  return {
    raw_data: row,
    normalized_first_name: cleanString(firstName) || null,
    normalized_last_name: cleanString(lastName) || null,
    normalized_email: normalizeEmail(email),
    normalized_phone: normalizePhone(phone),
    normalized_birth_year: normalizeBirthYear(birthYear),
    normalized_category_id: normalizeCategory(category),
    status: 'pending',
  }
}

export async function parseCsvFile(file: File): Promise<ImportRowInsert[]> {
  const text = await file.text()

  const parsed = Papa.parse<GenericRow>(text, {
    header: true,
    skipEmptyLines: true,
  })

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0].message)
  }

  return parsed.data.map(normalizeRow)
}

export async function parseExcelFile(file: File): Promise<ImportRowInsert[]> {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[firstSheetName]
  const json = XLSX.utils.sheet_to_json<GenericRow>(worksheet, { defval: '' })

  return json.map(normalizeRow)
}

export async function parseImportFile(file: File): Promise<ImportRowInsert[]> {
  const lowerName = file.name.toLowerCase()

  if (lowerName.endsWith('.csv')) {
    return parseCsvFile(file)
  }

  if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
    return parseExcelFile(file)
  }

  throw new Error('Format non pris en charge. Utilisez un fichier CSV, XLSX ou XLS.')
}