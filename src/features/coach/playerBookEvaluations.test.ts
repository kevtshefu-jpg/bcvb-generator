import {describe,it,expect} from 'vitest'
import ExcelJS from 'exceljs'
import {buildPlayerBookSnapshot,type PlayerBookEvaluation,type PlayerBookSnapshot} from './playerBookAggregation'
import {mapStaffBook} from './playerStaffBookService'
import {playerBookToText} from './playerBookPdfExport'
import {buildPlayerBookXlsx} from './playerBookXlsxExport'
import type {PlayerBookAudience} from './playerBookExportModel'
const evaluation:PlayerBookEvaluation={id:'e1',playerId:'p1',teamId:'t1',season:'2026-2027',period:'Bilan de rentrée',category:'U15F',date:'2026-10-08'}
const book:PlayerBookSnapshot={player:{id:'p1',teamId:'t1',season:'2026-2027',firstName:'Alice',lastName:'Test',teamName:'U15F'},evaluationCount:1,evaluations:[evaluation],activeObjectiveCount:0,objectives:[],monitoring:[],tests:[],programs:[],generatedAt:'2026-10-08T00:00:00Z'}
describe('internal evaluation register',()=>{
 it('allowlists metadata and excludes private content',()=>{
  const result=mapStaffBook({...book,evaluations:[{...evaluation,content_json:{coachComment:'PRIVATE'},createdBy:'PRIVATE',scores:[1]}]},'p1')
  expect(result.evaluations).toEqual([evaluation]);expect(JSON.stringify(result)).not.toContain('PRIVATE');expect(JSON.stringify(result)).not.toContain('scores')
 })
 it('keeps only register fields in staff PDF text',()=>{
  const source={...book,evaluations:[{...evaluation,content_json:{coachComment:'PRIVATE'}}]}
  const text=playerBookToText(source,'staff').text
  expect(text).toContain('2026-10-08 — Bilan de rentrée — U15F');expect(text).not.toContain('PRIVATE');expect(text).not.toContain('e1')
 })
 it('writes a readable XLSX register with no comments',async()=>{
  const source={...book,evaluations:[{...evaluation,content_json:{coachComment:'PRIVATE'}}]}
  const {buffer}=await buildPlayerBookXlsx(source,'staff');const wb=new ExcelJS.Workbook();await wb.xlsx.load(buffer)
  expect(wb.getWorksheet('Évaluations')?.getRow(2).values).toEqual([undefined,evaluation.date,evaluation.period,evaluation.category]);expect(JSON.stringify(wb.model)).not.toContain('PRIVATE')
 })
 for(const audience of ['parent','joueur'] as PlayerBookAudience[])it(`excludes register for ${audience}`,async()=>{
  expect(playerBookToText(book,audience).text).not.toContain(evaluation.period)
  const {buffer}=await buildPlayerBookXlsx(book,audience);const wb=new ExcelJS.Workbook();await wb.xlsx.load(buffer)
  expect(wb.getWorksheet('Évaluations')).toBeUndefined();expect(JSON.stringify(wb.model)).not.toContain(evaluation.period)
 })
 for(const field of ['playerId','teamId','season'] as const){
  const mixed={...book,evaluations:[{...evaluation,[field]:'other'}]}
  it(`rejects mixed ${field} during service mapping and aggregation`,()=>{
   expect(()=>mapStaffBook(mixed,'p1')).toThrow('PLAYER_BOOK_SOURCE_SCOPE_MISMATCH')
   expect(()=>buildPlayerBookSnapshot({profile:{playerId:'p1',teamId:'t1',season:'2026-2027'} as never,tests:[],monitoring:[],programs:[],evaluations:mixed.evaluations})).toThrow('PLAYER_BOOK_SOURCE_SCOPE_MISMATCH')
  })
  for(const audience of ['staff','parent','joueur'] as PlayerBookAudience[])it(`rejects mixed ${field} for ${audience} exports`,async()=>{
   expect(()=>playerBookToText(mixed,audience)).toThrow('PLAYER_BOOK_SOURCE_SCOPE_MISMATCH')
   await expect(buildPlayerBookXlsx(mixed,audience)).rejects.toThrow('PLAYER_BOOK_SOURCE_SCOPE_MISMATCH')
  })
 }
 it.each([undefined,null,{},[null],[{...evaluation,id:''}],[{...evaluation,period:' '}],[{...evaluation,date:'2026-02-30'}],[{...evaluation,date:'unknown'}],[{...evaluation,category:null}]])('refuses absent or malformed register %j',evaluations=>expect(()=>mapStaffBook({...book,evaluations},'p1')).toThrow())
 it('refuses duplicate evaluations and inconsistent count',()=>{
  expect(()=>mapStaffBook({...book,evaluationCount:2,evaluations:[evaluation,evaluation]},'p1')).toThrow()
  expect(()=>mapStaffBook({...book,evaluationCount:2},'p1')).toThrow()
 })
 it('accepts an empty category and empty authorized register',()=>{
  expect(mapStaffBook({...book,evaluations:[{...evaluation,category:''}]},'p1').evaluations?.[0].category).toBe('')
  expect(mapStaffBook({...book,evaluationCount:0,evaluations:[]},'p1').evaluations).toEqual([])
 })
 it('keeps legacy generic snapshots compatible',()=>expect(()=>playerBookToText({...book,evaluations:undefined},'staff')).not.toThrow())
})
