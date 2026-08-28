import ExcelJS from 'exceljs'

export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024
export const MAX_IMPORT_ROWS = 5_000
export const MAX_IMPORT_COLUMNS = 100

const MIME_BY_EXTENSION: Record<string, Set<string>> = {
  csv: new Set(['text/csv', 'text/plain', 'application/csv', 'application/vnd.ms-excel']),
  xlsx: new Set([
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream',
    'application/zip',
  ]),
}

export function getSafeImportExtension(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() || ''
  if (!['csv', 'xlsx'].includes(extension)) {
    throw new Error('Format refusé. Utilisez uniquement un fichier CSV ou XLSX moderne.')
  }
  if (file.size <= 0 || file.size > MAX_IMPORT_FILE_BYTES) {
    throw new Error('Fichier refusé. La taille maximale autorisée est de 5 Mo.')
  }
  if (file.type && !MIME_BY_EXTENSION[extension]?.has(file.type.toLowerCase())) {
    throw new Error(`Type MIME incohérent avec l’extension .${extension}.`)
  }
  return extension as 'csv' | 'xlsx'
}

function plainCellValue(value: ExcelJS.CellValue): string | number | boolean {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
  if (value instanceof Date) return value.toISOString()

  // ExcelJS n'exécute pas les formules, mais elles sont refusées pour empêcher
  // leur propagation vers un futur export ou tableur utilisateur.
  if ('formula' in value || 'sharedFormula' in value) {
    throw new Error('Le fichier contient une formule. Les imports acceptent uniquement des valeurs statiques.')
  }
  if ('hyperlink' in value) return String(value.text || '')
  if ('richText' in value) return value.richText.map((part) => part.text).join('')
  if ('error' in value) throw new Error('Le fichier contient une cellule en erreur.')

  throw new Error('Le fichier contient un type de cellule non pris en charge.')
}

function rowValues(row: ExcelJS.Row, maxColumns: number) {
  const values: Array<string | number | boolean> = []
  for (let index = 1; index <= maxColumns; index += 1) {
    values.push(plainCellValue(row.getCell(index).value))
  }
  return values
}

export async function readSafeXlsxRecords(file: File): Promise<Record<string, unknown>[]> {
  if (getSafeImportExtension(file) !== 'xlsx') throw new Error('Un fichier XLSX est requis.')

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(await file.arrayBuffer(), {
    ignoreNodes: ['dataValidations', 'extLst', 'picture', 'drawing'],
  })
  const worksheet = workbook.worksheets[0]
  if (!worksheet) throw new Error('Aucune feuille détectée dans le fichier.')
  if (worksheet.actualRowCount > MAX_IMPORT_ROWS + 1) throw new Error(`Le fichier dépasse ${MAX_IMPORT_ROWS} lignes.`)
  if (worksheet.actualColumnCount > MAX_IMPORT_COLUMNS) throw new Error(`Le fichier dépasse ${MAX_IMPORT_COLUMNS} colonnes.`)

  const headers = rowValues(worksheet.getRow(1), worksheet.actualColumnCount)
    .map((value) => String(value).trim())
  if (!headers.some(Boolean)) throw new Error('La ligne d’en-tête est vide.')

  const records: Record<string, unknown>[] = []
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const record: Record<string, unknown> = {}
    rowValues(row, worksheet.actualColumnCount).forEach((value, index) => {
      const header = headers[index]
      if (header) record[header] = value
    })
    if (Object.values(record).some((value) => String(value).trim())) records.push(record)
  })
  return records
}
