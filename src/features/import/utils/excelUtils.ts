import ExcelJS from 'exceljs'
import { normalizeRow, type NormalizedImportRow } from './normalizeImportRows'
import type { ImportTemplate } from '../data/importTemplates'

function rowValuesToArray(values: ExcelJS.CellValue[] | { [key: string]: ExcelJS.CellValue }) {
  if (Array.isArray(values)) {
    return values.slice(1)
  }

  return Object.keys(values)
    .map((key) => Number(key))
    .filter((key) => !Number.isNaN(key))
    .sort((a, b) => a - b)
    .filter((key) => key >= 1)
    .map((key) => values[key])
}

export async function parseExcelFile(file: File): Promise<NormalizedImportRow[]> {
  const workbook = new ExcelJS.Workbook()
  const buffer = await file.arrayBuffer()
  await workbook.xlsx.load(buffer)

  const worksheet = workbook.worksheets[0]
  if (!worksheet) return []

  const rows: Record<string, unknown>[] = []

  const headerRow = worksheet.getRow(1)
  const headerValues = rowValuesToArray(headerRow.values as ExcelJS.CellValue[])

  const headers = headerValues.map((value: ExcelJS.CellValue) => String(value ?? '').trim())

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return

    const raw: Record<string, unknown> = {}
    const rowValues = rowValuesToArray(row.values as ExcelJS.CellValue[])

    rowValues.forEach((value: ExcelJS.CellValue, index: number) => {
      const key = headers[index]
      if (key) raw[key] = value ?? ''
    })

    const hasSomeValue = Object.values(raw).some((value) => String(value ?? '').trim() !== '')
    if (hasSomeValue) rows.push(raw)
  })

  return rows.map(normalizeRow)
}

export async function exportTemplateExcel(template: ImportTemplate) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(template.title)

  const headers = template.columns.map((column) => column.label)
  const keys = template.columns.map((column) => column.key)
  const example = template.columns.map((column) => column.example ?? '')

  worksheet.addRow(headers)
  worksheet.addRow(example)

  worksheet.getRow(1).font = { bold: true }
  worksheet.columns = keys.map((key, index) => ({
    key,
    width: Math.max(16, headers[index].length + 4),
  }))

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${template.type}-modele.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}