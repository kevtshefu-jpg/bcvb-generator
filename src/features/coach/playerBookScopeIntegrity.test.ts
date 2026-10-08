import { describe, expect, it } from 'vitest'
import ExcelJS from 'exceljs'
import { buildPlayerBookSnapshot, type PlayerBookSnapshot } from './playerBookAggregation'
import { buildPlayerBookExportModel, type PlayerBookAudience } from './playerBookExportModel'
import { exportPlayerBookPdf, playerBookToText } from './playerBookPdfExport'
import { buildPlayerBookXlsx } from './playerBookXlsxExport'
import type { PlayerProgressionProfile } from './playerProgressionService'

const profile:PlayerProgressionProfile={playerId:'p1',teamId:'t1',firstName:'Alice',lastName:'Test',teamName:'U15F',teamCategory:'U15',category:'U15',season:'2026-2027',attendanceStatus:null,evaluationStatus:null,objectivesStatus:null,documentsStatus:null,evaluationCount:2,activeObjectiveCount:1,lastEvaluationDate:null,summary:{}}
const scope={playerId:'p1',teamId:'t1',season:'2026-2027'}
function snapshot():PlayerBookSnapshot {
 return {
  player:{id:'p1',teamId:'t1',season:'2026-2027',firstName:'Alice',lastName:'Test',teamName:'U15F'},evaluationCount:2,activeObjectiveCount:1,generatedAt:'2026-10-08T00:00:00Z',
  tests:[{...scope,id:'test',testCode:'LOCAL',testName:'Authorized test',measuredAt:'2026-10-08',value:2,unit:'s',protocolVersion:'local',contextNote:'PRIVATE_CONTEXT',createdAt:'x',updatedAt:'x'}],
  monitoring:[],
  programs:[{...scope,id:'program',title:'Authorized program',startDate:'2026-10-08',endDate:'2026-11-01',level:1,status:'active',safetyState:'vert',weeks:[]}],
 }
}
const sources=['tests','monitoring','programs'] as const
const fields=['playerId','teamId','season'] as const
const audiences:PlayerBookAudience[]=['joueur','parent','staff']
function mixed(source:typeof sources[number],field:typeof fields[number]):PlayerBookSnapshot {
 const book=snapshot()
 // A wrongly scoped observation must never be associated with this player's book,
 // including monitoring even though its export is disabled.
 const row={...(source==='programs'?book.programs[0]:book.tests[0]),[field]:'OTHER_PRIVATE_SCOPE'}
 return {...book,[source]:[row]}
}

describe('Player Book source scope integrity',()=>{
 for(const source of sources)for(const field of fields){
  it(`rejects ${source} from a different ${field} during aggregation`,()=>{
   const book=mixed(source,field)
   expect(()=>buildPlayerBookSnapshot({profile,tests:book.tests,monitoring:book.monitoring,programs:book.programs})).toThrow('PLAYER_BOOK_SOURCE_SCOPE_MISMATCH')
  })
  for(const audience of audiences){
   it(`refuses mixed ${source}/${field} at PDF entry for ${audience}`,async()=>{
    const book=mixed(source,field)
    expect(()=>playerBookToText(book,audience)).toThrow('PLAYER_BOOK_SOURCE_SCOPE_MISMATCH')
    await expect(exportPlayerBookPdf(book,audience)).rejects.toThrow('PLAYER_BOOK_SOURCE_SCOPE_MISMATCH')
   })
   it(`refuses mixed ${source}/${field} at XLSX entry for ${audience}`,async()=>{
    await expect(buildPlayerBookXlsx(mixed(source,field),audience)).rejects.toThrow('PLAYER_BOOK_SOURCE_SCOPE_MISMATCH')
   })
  }
 }
 for(const audience of audiences){
  it(`preserves properly scoped content for ${audience}`,async()=>{
   const book=snapshot()
   const assembled=buildPlayerBookSnapshot({profile,tests:book.tests,monitoring:book.monitoring,programs:book.programs})
   expect(assembled.player.teamId).toBe('t1')
   expect(playerBookToText(assembled,audience).text).toContain('Authorized test — 2 s')
   expect(playerBookToText(assembled,audience).text).toContain('Authorized program')
   const result=await buildPlayerBookXlsx(assembled,audience)
   const wb=new ExcelJS.Workbook();await wb.xlsx.load(result.buffer)
   expect(wb.getWorksheet('Tests')?.getCell('A2').value).toBe('Authorized test')
   expect(wb.getWorksheet('Programmes')?.getCell('A2').value).toBe('Authorized program')
  })
 }
 it.each(['id','teamId','season'] as const)('rejects a missing canonical %s',async(field)=>{
  const book=snapshot();book.player[field]=''
  expect(()=>playerBookToText(book,'joueur')).toThrow('PLAYER_BOOK_SCOPE_MISSING')
  await expect(buildPlayerBookXlsx(book,'joueur')).rejects.toThrow('PLAYER_BOOK_SCOPE_MISSING')
 })
 it.each(sources)('rejects a malformed %s source',async(source)=>{
  const book={...snapshot(),[source]:null} as unknown as PlayerBookSnapshot
  expect(()=>playerBookToText(book,'joueur')).toThrow('PLAYER_BOOK_SOURCE_MALFORMED')
  await expect(buildPlayerBookXlsx(book,'joueur')).rejects.toThrow('PLAYER_BOOK_SOURCE_MALFORMED')
 })
 it('revalidates a snapshot modified after aggregation',async()=>{
  const book=snapshot();const assembled=buildPlayerBookSnapshot({profile,tests:book.tests,monitoring:[],programs:[]})
  assembled.tests[0].playerId='p2'
  await expect(exportPlayerBookPdf(assembled,'joueur')).rejects.toThrow('PLAYER_BOOK_SOURCE_SCOPE_MISMATCH')
  await expect(buildPlayerBookXlsx(assembled,'joueur')).rejects.toThrow('PLAYER_BOOK_SOURCE_SCOPE_MISMATCH')
 })
 it('rejects an unsupported runtime audience',async()=>{
  const audience='external' as PlayerBookAudience
  expect(()=>playerBookToText(snapshot(),audience)).toThrow('PLAYER_BOOK_AUDIENCE_UNSUPPORTED')
  await expect(buildPlayerBookXlsx(snapshot(),audience)).rejects.toThrow('PLAYER_BOOK_AUDIENCE_UNSUPPORTED')
 })
 it('rejects an unsupported runtime format',()=>{
  expect(()=>buildPlayerBookExportModel(snapshot(),'joueur','html' as never)).toThrow('PLAYER_BOOK_FORMAT_UNSUPPORTED')
 })
})
