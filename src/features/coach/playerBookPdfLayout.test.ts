import {describe,it,expect} from 'vitest'
import {buildPlayerBookPdf,playerBookToText} from './playerBookPdfExport'
import type {PlayerBookSnapshot} from './playerBookAggregation'
const scope={playerId:'p1',teamId:'t1',season:'2026-2027'}
const book:PlayerBookSnapshot={player:{id:'p1',teamId:'t1',season:'2026-2027',firstName:'Élodie',lastName:'Test',teamName:'U15F'},evaluationCount:0,activeObjectiveCount:0,tests:[],monitoring:[],programs:[{...scope,title:'Programme fictif',startDate:'2026-10-08',endDate:'2026-11-19',level:2,status:'active'}],generatedAt:'2026-10-08'}
describe('Player Book PDF layout',()=>{
 it('uses a supported date separator',()=>{const text=playerBookToText(book,'staff').text;expect(text).toContain('2026-10-08 au 2026-11-19');expect(text).not.toContain('→')})
 it('paginates a long book with page counts and internal footer',async()=>{
  const objectives=Array.from({length:18},(_,i)=>({...scope,id:`o${i}`,title:`Objectif ${i}`,domain:'skills',targetDescription:'Maîtriser le ballon et lire le défenseur. '.repeat(7),observableCriterion:'Conserver le contrôle',quantifiableCriterion:null,deadline:null,status:'en_cours' as const}))
  const {pdf}=await buildPlayerBookPdf({...book,objectives,activeObjectiveCount:18},'staff')
  const pages=pdf.getNumberOfPages();expect(pages).toBeGreaterThan(1)
  const source=pdf.output();expect(source.match(/Usage interne/g)).toHaveLength(pages)
  expect(source).toContain(`${pages} / ${pages}`)
 })
})
