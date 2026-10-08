import {describe,it,expect} from 'vitest'
import ExcelJS from 'exceljs'
import {buildPlayerBookXlsx} from './playerBookXlsxExport'
import type {PlayerBookSnapshot} from './playerBookAggregation'
const scope={playerId:'p1',teamId:'t1',season:'2026-2027'}
const book:PlayerBookSnapshot={player:{id:'p1',teamId:'t1',season:'2026-2027',firstName:'Élodie',lastName:'Test',teamName:'U15F'},evaluationCount:0,activeObjectiveCount:1,objectives:[{...scope,id:'o1',title:'Premier pas',domain:'skills',targetDescription:'Lire le défenseur. '.repeat(20),observableCriterion:'Conserver le contrôle',quantifiableCriterion:null,deadline:null,status:'en_cours'}],tests:[{...scope,testName:'Sprint',value:2.1,unit:'s',measuredAt:'2026-10-08',protocolVersion:'v1'}],monitoring:[],programs:[],generatedAt:'2026-10-08'}
describe('Player Book XLSX readability',()=>{
 it('preserves values and numbers after styling and round-trip',async()=>{
  const {buffer}=await buildPlayerBookXlsx(book,'staff');const wb=new ExcelJS.Workbook();await wb.xlsx.load(buffer)
  const goals=wb.getWorksheet('Objectifs')!
  expect(goals.getCell('C2').value).toBe(book.objectives![0].targetDescription)
  expect(goals.getCell('C2').alignment.wrapText).toBe(true);expect(goals.getRow(2).height).toBeGreaterThan(24)
  expect(goals.getColumn(3).width).toBe(48);expect(goals.views[0]).toMatchObject({state:'frozen',ySplit:1})
  expect(goals.autoFilter).toBe('A1:G2')
  expect(wb.getWorksheet('Tests')!.getCell('B2').value).toBe(2.1)
  const summary=wb.getWorksheet('Player Book')!;expect(summary.getCell('A1').value).toContain('Élodie Test');expect(summary.getCell('B1').isMerged).toBe(true)
  expect(summary.getCell('B6').value).toBe(1)
 })
 it('keeps family exports minimized and retains very long text',async()=>{
  const long={...book,objectives:[{...book.objectives![0],targetDescription:'texte '.repeat(5000)}]}
  const staff=await buildPlayerBookXlsx(long,'staff');const wb=new ExcelJS.Workbook();await wb.xlsx.load(staff.buffer)
  expect(wb.getWorksheet('Objectifs')!.getCell('C2').value).toBe(long.objectives[0].targetDescription)
  expect(wb.getWorksheet('Objectifs')!.getRow(2).height).toBeLessThanOrEqual(409)
  for(const audience of ['parent','joueur'] as const){const {buffer}=await buildPlayerBookXlsx(book,audience);const w=new ExcelJS.Workbook();await w.xlsx.load(buffer);expect(w.getWorksheet('Objectifs')).toBeUndefined();expect(w.getWorksheet('Suivi')).toBeUndefined()}
 })
})
