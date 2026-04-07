import Papa from 'papaparse'
import { normalizeRow, type NormalizedImportRow } from './normalizeImportRows'
import type { ImportTemplate } from '../data/importTemplates'

type GenericRow = Record<string, unknown>

export async function parseCsvFile(file: File): Promise<NormalizedImportRow[]> {
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

export function exportTemplateCsv(template: ImportTemplate) {
  const headers = template.columns.map((column) => column.key)
  const exampleRow = template.columns.reduce<Record<string, string>>((acc, column) => {
    acc[column.key] = column.example ?? ''
    return acc
  }, {})

  const csv = Papa.unparse({
    fields: headers,
    data: [exampleRow],
  })

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${template.type}-modele.csv`
  link.click()
  URL.revokeObjectURL(url)
}