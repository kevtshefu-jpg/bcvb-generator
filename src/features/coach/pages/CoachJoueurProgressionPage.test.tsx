import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CoachJoueurProgressionPage from './CoachJoueurProgressionPage'

const mocks=vi.hoisted(()=>({id:'p1',profile:vi.fn(),tests:vi.fn(),summary:vi.fn(),raw:vi.fn(),programs:vi.fn()}))
vi.mock('react-router-dom',async()=>({...await vi.importActual('react-router-dom'),useParams:()=>({id:mocks.id})}))
vi.mock('../playerProgressionService',()=>({playerProgressionService:{readProfile:mocks.profile}}))
vi.mock('../performanceTestService',()=>({performanceTestService:{readPlayer:mocks.tests}}))
vi.mock('../playerMonitoringService',()=>({playerMonitoringService:{readSummary:mocks.summary,readPlayer:mocks.raw}}))
vi.mock('../playerProgramService',()=>({playerProgramService:{readPlayer:mocks.programs}}))
const profile=(id:string)=>({playerId:id,firstName:id==='p1'?'Alice':'Binta',lastName:'Test',teamId:'t1',teamName:'U15F',teamCategory:'U15',season:'2026-2027',evaluationCount:2,activeObjectiveCount:1})
const view=()=> <MemoryRouter><CoachJoueurProgressionPage/></MemoryRouter>
describe('dashboard monitoring minimization',()=>{
 beforeEach(()=>{vi.resetAllMocks();mocks.id='p1';mocks.profile.mockImplementation(async(id)=>profile(id));mocks.tests.mockResolvedValue([]);mocks.programs.mockResolvedValue([]);mocks.summary.mockResolvedValue({entryCount:3,lastMonitoredOn:'2026-10-08'})})
 it('loads only the summary and renders count/date',async()=>{
  render(view());expect(await screen.findByText('3 · dernier : 2026-10-08')).toBeInTheDocument()
  expect(mocks.summary).toHaveBeenCalledWith('p1','t1');expect(mocks.raw).not.toHaveBeenCalled()
 })
 it('keeps other sources when summary access is denied',async()=>{
  mocks.summary.mockRejectedValue({code:'42501'});mocks.tests.mockResolvedValue([{measuredAt:'2026-10-07'}]);render(view())
  expect(await screen.findByText('Indisponible')).toBeInTheDocument();expect(screen.getByText('1 · dernier : 2026-10-07')).toBeInTheDocument()
  expect(mocks.raw).not.toHaveBeenCalled()
 })
 it('discards the previous player summary and ignores stale responses',async()=>{
  let resolveFirst!:(v:{entryCount:number;lastMonitoredOn:string|null})=>void
  mocks.summary.mockImplementationOnce(()=>new Promise(resolve=>{resolveFirst=resolve})).mockResolvedValueOnce({entryCount:0,lastMonitoredOn:null})
  const rendered=render(view());await waitFor(()=>expect(mocks.summary).toHaveBeenCalledTimes(1))
  mocks.id='p2';rendered.rerender(view());await waitFor(()=>expect(mocks.summary).toHaveBeenCalledTimes(2))
  await act(async()=>resolveFirst({entryCount:99,lastMonitoredOn:'2026-10-08'}))
  expect(screen.queryByText('99 · dernier : 2026-10-08')).not.toBeInTheDocument();expect(screen.getByText('Binta Test',{selector:'h2'})).toBeInTheDocument()
  expect(mocks.raw).not.toHaveBeenCalled()
 })
})
