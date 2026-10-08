import {describe,it,expect} from 'vitest'
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs'
import {normalizePlayerBookPdfText} from './playerBookPdfFont'
async function extract(pdf:Awaited<ReturnType<typeof buildPlayerBookPdf>>['pdf']){
 const doc=await getDocument({data:new Uint8Array(pdf.output('arraybuffer')),disableFontFace:true,isEvalSupported:false}).promise
 const texts=[];try{for(let i=1;i<=doc.numPages;i++){const page=await doc.getPage(i);const content=await page.getTextContent();texts.push(content.items.map(item=>'str' in item?item.str:'').join(' '))}return texts}finally{await doc.destroy()}
}
import {buildPlayerBookPdf,playerBookToText} from './playerBookPdfExport'
import type {PlayerBookSnapshot} from './playerBookAggregation'
const scope={playerId:'p1',teamId:'t1',season:'2026-2027'}
const book:PlayerBookSnapshot={player:{id:'p1',teamId:'t1',season:'2026-2027',firstName:'Élodie',lastName:'Test',teamName:'U15F'},evaluationCount:0,activeObjectiveCount:0,tests:[],monitoring:[],programs:[{...scope,title:'Programme fictif',startDate:'2026-10-08',endDate:'2026-11-19',level:2,status:'active'}],generatedAt:'2026-10-08'}
describe('Player Book PDF layout',()=>{
 it('round-trips extended names and arrows without substitution',async()=>{
  const name='Łukasz Œuvre Đorđe Γιάννης Олексій'
  const {pdf}=await buildPlayerBookPdf({...book,player:{...book.player,firstName:name,lastName:'E\u0301lodie'},programs:[{...book.programs[0],title:'Départ → arrêt ← retour'}]},'staff')
  const text=(await extract(pdf)).join(' ');for(const value of [name,'Élodie','Départ → arrêt ← retour'])expect(text).toContain(value)
 })
 it('refuses unsupported text without leaking its content in the error',()=>{expect(()=>normalizePlayerBookPdfText('PRIVATE 🏀')).toThrow('PLAYER_BOOK_PDF_UNSUPPORTED_CHARACTER');expect(normalizePlayerBookPdfText('E\u0301lodie')).toBe('Élodie')})
 it('uses a supported date separator',()=>{const text=playerBookToText(book,'staff').text;expect(text).toContain('2026-10-08 au 2026-11-19');expect(text).not.toContain('→')})
 it('paginates a long book with page counts and internal footer',async()=>{
  const objectives=Array.from({length:18},(_,i)=>({...scope,id:`o${i}`,title:`Objectif ${i}`,domain:'skills',targetDescription:'Maîtriser le ballon et lire le défenseur. '.repeat(7),observableCriterion:'Conserver le contrôle',quantifiableCriterion:null,deadline:null,status:'en_cours' as const}))
  const {pdf}=await buildPlayerBookPdf({...book,objectives,activeObjectiveCount:18},'staff')
  const pages=pdf.getNumberOfPages();expect(pages).toBeGreaterThan(1)
  const texts=await extract(pdf);expect(texts).toHaveLength(pages)
  texts.forEach((text,i)=>{expect(text).toContain('Usage interne');expect(text).toContain(`${i+1} / ${pages}`)})
 })
})
