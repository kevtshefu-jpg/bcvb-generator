import {beforeEach,describe,it,expect,vi} from 'vitest'
import {render,screen,fireEvent,waitFor,act} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import CoachPlayerBookPage from './CoachPlayerBookPage'
const mocks=vi.hoisted(()=>({id:'p1',read:vi.fn(),pdf:vi.fn(),save:vi.fn(),xlsx:vi.fn()}))
vi.mock('react-router-dom',async()=>({...await vi.importActual('react-router-dom'),useParams:()=>({id:mocks.id})}))
vi.mock('../playerStaffBookService',()=>({playerStaffBookService:{read:mocks.read}}))
vi.mock('../playerBookPdfExport',()=>({buildPlayerBookPdf:mocks.pdf}))
vi.mock('../playerBookXlsxExport',()=>({buildPlayerBookXlsx:mocks.xlsx}))
const book=(id='p1')=>({player:{id,teamId:'t1',firstName:id==='p1'?'Alice':'Binta',lastName:'Test',teamName:'U15F',season:'2026-2027'},evaluationCount:2,activeObjectiveCount:1,tests:[],programs:[],monitoring:[],generatedAt:'2026-10-08'})
const view=()=> <MemoryRouter><CoachPlayerBookPage/></MemoryRouter>
describe('internal book page',()=>{
 beforeEach(()=>{vi.resetAllMocks();mocks.id='p1';mocks.read.mockImplementation(async(id)=>book(id));mocks.pdf.mockResolvedValue({filename:'book.pdf',pdf:{save:mocks.save}})})
 it('renders a book and rechecks before staff PDF download',async()=>{
  render(view());await screen.findByText('U15F · 2026-2027');fireEvent.click(screen.getByText('Exporter PDF'))
  await waitFor(()=>expect(mocks.save).toHaveBeenCalledWith('book.pdf'))
  expect(mocks.read).toHaveBeenCalledTimes(2);expect(mocks.pdf).toHaveBeenCalledWith(book(),'staff')
 })
 it('creates and releases the XLSX download URL',async()=>{
  const create=vi.fn(()=> 'blob:test'),revoke=vi.fn();vi.stubGlobal('URL',class extends URL{static createObjectURL=create;static revokeObjectURL=revoke})
  const click=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{})
  mocks.xlsx.mockResolvedValue({filename:'book.xlsx',buffer:new Uint8Array([1,2])})
  try{render(view());await screen.findByText('U15F · 2026-2027');fireEvent.click(screen.getByText('Exporter XLSX'));await waitFor(()=>expect(revoke).toHaveBeenCalledWith('blob:test'));expect(click).toHaveBeenCalledTimes(1);expect(mocks.xlsx).toHaveBeenCalledWith(book(),'staff')}finally{click.mockRestore();vi.unstubAllGlobals()}
 })
 it('does not export after permission revocation',async()=>{
  mocks.read.mockResolvedValueOnce(book()).mockRejectedValueOnce({code:'42501'})
  render(view());await screen.findByText('U15F · 2026-2027');fireEvent.click(screen.getByText('Exporter PDF'))
  expect(await screen.findByRole('alert')).toHaveTextContent('Export impossible');expect(mocks.pdf).not.toHaveBeenCalled()
 })
 it('hides export controls when the source fails',async()=>{
  mocks.read.mockRejectedValue({code:'PGRST202'});render(view());await screen.findByText('Player Book indisponible');expect(screen.queryByText('Exporter PDF')).not.toBeInTheDocument()
 })
 it('renders the saved pedagogical criteria and deadline',async()=>{
  mocks.read.mockResolvedValue({...book(),objectives:[{id:'o1',title:'Premier pas',status:'en_cours',targetDescription:'Créer un avantage',observableCriterion:'Déborder',quantifiableCriterion:'4 sur 5',deadline:'4 semaines'}]})
  render(view());await screen.findByText('Premier pas · En cours')
  expect(screen.getByText('Critère observable : Déborder')).toBeInTheDocument();expect(screen.getByText('Critère quantifiable : 4 sur 5')).toBeInTheDocument();expect(screen.getByText('Échéance : 4 semaines')).toBeInTheDocument()
 })
 it('renders evaluation metadata without scores or comments',async()=>{
  mocks.read.mockResolvedValue({...book(),evaluations:[{id:'e1',date:'2026-10-08',period:'Bilan de rentrée',category:'U15F',coachComment:'PRIVATE',scores:[1]}]})
  render(view());await screen.findByText('2026-10-08 · Bilan de rentrée · U15F');expect(screen.queryByText('PRIVATE')).not.toBeInTheDocument()
 })
 it('offers XLSX when PDF characters are unsupported',async()=>{
  mocks.pdf.mockRejectedValue(new Error('PLAYER_BOOK_PDF_UNSUPPORTED_CHARACTER'));render(view());await screen.findByText('U15F · 2026-2027');fireEvent.click(screen.getByText('Exporter PDF'));expect(await screen.findByRole('alert')).toHaveTextContent('Utilisez l’export XLSX');expect(mocks.save).not.toHaveBeenCalled()
 })
 it('cancels an export when the player changes',async()=>{
  let resolve!:(value:ReturnType<typeof book>)=>void
  mocks.read.mockResolvedValueOnce(book()).mockImplementationOnce(()=>new Promise(r=>{resolve=r})).mockResolvedValueOnce(book('p2'))
  const result=render(view());await screen.findByText('U15F · 2026-2027');fireEvent.click(screen.getByText('Exporter PDF'))
  await waitFor(()=>expect(mocks.read).toHaveBeenCalledTimes(2));mocks.id='p2';result.rerender(view())
  await screen.findByText('Player Book — Binta Test');await act(async()=>resolve(book()))
  expect(mocks.pdf).not.toHaveBeenCalled();expect(screen.queryByText('Player Book — Alice Test')).not.toBeInTheDocument()
 })
})
