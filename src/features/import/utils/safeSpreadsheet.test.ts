import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import { getSafeImportExtension, MAX_IMPORT_FILE_BYTES, readSafeXlsxRecords } from './safeSpreadsheet'

function file(parts: BlobPart[], name: string, type: string) {
  return new File(parts, name, { type })
}

describe('imports tableur non fiables', () => {
  it('refuse les extensions historiques, les MIME incohérents et les fichiers trop grands', () => {
    expect(() => getSafeImportExtension(file(['x'], 'joueurs.xls', 'application/vnd.ms-excel'))).toThrow(/Format refusé/)
    expect(() => getSafeImportExtension(file(['x'], 'joueurs.xlsx', 'text/html'))).toThrow(/MIME incohérent/)
    const oversized = { name: 'joueurs.xlsx', type: '', size: MAX_IMPORT_FILE_BYTES + 1 } as File
    expect(() => getSafeImportExtension(oversized)).toThrow(/5 Mo/)
  })

  it('lit uniquement des valeurs statiques depuis un XLSX valide', async () => {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Joueurs')
    sheet.addRow(['Prénom', 'Nom'])
    sheet.addRow(['Alice', 'Test'])
    const buffer = await workbook.xlsx.writeBuffer()
    const rows = await readSafeXlsxRecords(file([buffer], 'joueurs.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'))
    expect(rows).toEqual([{ Prénom: 'Alice', Nom: 'Test' }])
  })

  it('refuse toute formule, même si un résultat calculé est présent', async () => {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Joueurs')
    sheet.addRow(['Prénom'])
    sheet.getCell('A2').value = { formula: 'HYPERLINK("https://example.test","ouvrir")', result: 'ouvrir' }
    const buffer = await workbook.xlsx.writeBuffer()
    const input = file([buffer], 'formule.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    await expect(readSafeXlsxRecords(input)).rejects.toThrow(/formule/)
  })
})
