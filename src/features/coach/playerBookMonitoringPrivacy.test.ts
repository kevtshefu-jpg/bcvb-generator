import { describe, expect, it } from 'vitest'
import ExcelJS from 'exceljs'
import { buildPlayerBookExportModel, type PlayerBookAudience } from './playerBookExportModel'
import { playerBookToText } from './playerBookPdfExport'
import { buildPlayerBookXlsx } from './playerBookXlsxExport'
import type { PlayerBookSnapshot } from './playerBookAggregation'

const snapshot = {
  player: { id: 'player', teamId: 'team', firstName: 'A', lastName: 'B', teamName: 'U15F', season: '2026-2027' },
  evaluationCount: 0,
  activeObjectiveCount: 0,
  tests: [],
  monitoring: [{ playerId: 'player', teamId: 'team', season: '2026-2027', monitoredOn: '2026-10-08', availability: 'arret', pain: 9, fatigue: 8, sleepQuality: 2, note: 'CONFIDENTIAL_MONITORING_MARKER' }],
  programs: [],
  generatedAt: '2026-10-08T00:00:00Z',
} as unknown as PlayerBookSnapshot

describe('Player Book monitoring confidentiality', () => {
  for (const audience of ['joueur', 'parent', 'staff'] as PlayerBookAudience[]) {
    it(`excludes sensitive monitoring from PDF for ${audience}`, () => {
      const result = playerBookToText(snapshot, audience)
      expect(buildPlayerBookExportModel(snapshot, audience, 'pdf').sections.find(s => s.id === 'monitoring')?.available).toBe(false)
      expect(result.text).not.toContain('CONFIDENTIAL_MONITORING_MARKER')
      expect(result.text).not.toContain('disponibilité : arret')
      expect(result.text).not.toContain('Suivi et charge')
    })
    it(`excludes sensitive monitoring from XLSX for ${audience}`, async () => {
      const result = await buildPlayerBookXlsx(snapshot, audience)
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(result.buffer)
      expect(workbook.worksheets.map(sheet => sheet.name)).not.toContain('Suivi')
      expect(JSON.stringify(workbook.worksheets.map(sheet => sheet.getSheetValues()))).not.toContain('CONFIDENTIAL_MONITORING_MARKER')
    })
  }
})
