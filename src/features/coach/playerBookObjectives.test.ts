import {describe,it,expect} from 'vitest'
import ExcelJS from 'exceljs'
import {buildPlayerBookSnapshot,type PlayerBookObjective,type PlayerBookSnapshot} from './playerBookAggregation'
import {mapStaffBook} from './playerStaffBookService'
import {buildPlayerBookPdf,playerBookToText} from './playerBookPdfExport'
import {buildPlayerBookXlsx} from './playerBookXlsxExport'
import type {PlayerBookAudience} from './playerBookExportModel'
const objective:PlayerBookObjective={id:'o1',playerId:'p1',teamId:'t1',season:'2026-2027',title:'PEDAGOGICAL_OBJECTIVE',domain:'skills',targetDescription:'Créer un avantage',observableCriterion:'Déborder le défenseur',quantifiableCriterion:'Réussir 4 essais sur 5',deadline:'Dans 4 semaines',status:'en_cours'}
const book:PlayerBookSnapshot={player:{id:'p1',teamId:'t1',season:'2026-2027',firstName:'Alice',lastName:'Test',teamName:'U15F'},evaluationCount:0,evaluations:[],activeObjectiveCount:1,objectives:[objective],monitoring:[],tests:[],programs:[],generatedAt:'2026-10-08T00:00:00Z'}
describe('internal pedagogical objectives',()=>{
 it('maps canonical content and strips unrelated fields',()=>{
  const result=mapStaffBook({...book,objectives:[{...objective,linkedSessionIds:['PRIVATE_SESSION'],note:'PRIVATE_NOTE'}]},'p1')
  expect(result.objectives).toEqual([objective]);expect(JSON.stringify(result)).not.toContain('PRIVATE')
 })
 it('exports the actual criteria in PDF source and generates a PDF',async()=>{
  const text=playerBookToText(book,'staff').text
  for(const value of [objective.title,objective.targetDescription,objective.observableCriterion,objective.quantifiableCriterion!,objective.deadline!,'En cours'])expect(text).toContain(value)
  const {pdf}=await buildPlayerBookPdf(book,'staff')
  expect(new TextDecoder().decode(new Uint8Array(pdf.output('arraybuffer')).slice(0,4))).toBe('%PDF')
 })
 it('exports the objective in a readable XLSX sheet',async()=>{
  const {buffer}=await buildPlayerBookXlsx(book,'staff');const wb=new ExcelJS.Workbook();await wb.xlsx.load(buffer)
  expect(wb.getWorksheet('Objectifs')?.getRow(2).values).toEqual([undefined,objective.title,objective.domain,objective.targetDescription,objective.observableCriterion,objective.quantifiableCriterion,objective.deadline,'En cours'])
 })
 for(const audience of ['parent','joueur'] as PlayerBookAudience[])it(`does not add objective details to ${audience} exports`,async()=>{
  expect(playerBookToText(book,audience).text).not.toContain(objective.title)
  const {buffer}=await buildPlayerBookXlsx(book,audience);const wb=new ExcelJS.Workbook();await wb.xlsx.load(buffer)
  expect(wb.getWorksheet('Objectifs')).toBeUndefined();expect(JSON.stringify(wb.model)).not.toContain(objective.title)
 })
 for(const field of ['playerId','teamId','season'] as const){
  const mixed={...book,objectives:[{...objective,[field]:'other'}]}
  it(`rejects a different ${field} at aggregation`,()=>expect(()=>buildPlayerBookSnapshot({profile:{playerId:'p1',teamId:'t1',season:'2026-2027'} as never,tests:[],monitoring:[],programs:[],objectives:mixed.objectives})).toThrow('PLAYER_BOOK_SOURCE_SCOPE_MISMATCH'))
  for(const audience of ['staff','parent','joueur'] as PlayerBookAudience[])it(`rejects mixed ${field} at both export boundaries for ${audience}`,async()=>{
   expect(()=>playerBookToText(mixed,audience)).toThrow('PLAYER_BOOK_SOURCE_SCOPE_MISMATCH')
   await expect(buildPlayerBookXlsx(mixed,audience)).rejects.toThrow('PLAYER_BOOK_SOURCE_SCOPE_MISMATCH')
  })
 }
 it.each([undefined,null,{},[{...objective,status:'unknown'}],[{...objective,deadline:2}],[{...objective,observableCriterion:''}]])('rejects missing/malformed objectives %j',objectives=>expect(()=>mapStaffBook({...book,objectives},'p1')).toThrow())
 it('rejects an incoherent active count',()=>expect(()=>mapStaffBook({...book,activeObjectiveCount:0},'p1')).toThrow())
 it('preserves closed objectives with no optional criteria',()=>{
  const result=mapStaffBook({...book,activeObjectiveCount:0,objectives:[{...objective,status:'valide',quantifiableCriterion:null,deadline:null}]},'p1')
  expect(result.objectives?.[0].status).toBe('valide')
 })
})
