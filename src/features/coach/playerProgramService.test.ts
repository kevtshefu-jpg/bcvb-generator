import{describe,expect,it,vi}from'vitest';import{createPlayerProgramService,mapPlayerProgram,PROGRAM_PHASES}from'./playerProgramService'
const row={id:'p',player_id:'j',team_id:'t',season:'2026-2027',title:'Cycle',start_date:'2026-10-01',end_date:'2026-11-12',level:2,status:'draft',safety_state:'vert',weeks:[{id:'w',week_number:1,phase:'diagnostic_apprentissage',starts_on:'2026-10-01',ends_on:'2026-10-07',sessions:[]}]}
describe('playerProgramService',()=>{it('préserve les six phases BCVB',()=>expect(PROGRAM_PHASES).toHaveLength(6));it('mappe un programme canonique',()=>expect(mapPlayerProgram(row)).toMatchObject({level:2,safetyState:'vert'}));it('lit via RPC',async()=>{const rpc=vi.fn().mockResolvedValue({data:[row],error:null});const s=createPlayerProgramService({rpc} as never);await expect(s.readPlayer('j','t')).resolves.toHaveLength(1)})})
 describe('dashboard summary',()=>{
 it('requests only aggregates and strips unrelated details',async()=>{
  const rpc=vi.fn().mockResolvedValue({data:[{program_count:3,active_program_count:1,title:'PRIVATE',safety_state:'rouge',weeks:[]}],error:null})
  await expect(createPlayerProgramService({rpc} as never).readSummary('p1','t1')).resolves.toEqual({programCount:3,activeProgramCount:1})
  expect(rpc).toHaveBeenCalledExactlyOnceWith('read_player_program_summary',{target_player_id:'p1',target_team_id:'t1'})
 })
 it.each([null,[],{}, {program_count:-1,active_program_count:0}, {program_count:0,active_program_count:1}, {program_count:1,active_program_count:-1}, {program_count:'3',active_program_count:1}, {program_count:1.5,active_program_count:0}, {program_count:1,active_program_count:0.5}])('rejects malformed summary %j',async(value)=>{
  const rpc=vi.fn().mockResolvedValue({data:[value],error:null})
  await expect(createPlayerProgramService({rpc} as never).readSummary('p1','t1')).rejects.toThrow('MALFORMED_PROGRAM_SUMMARY_RESPONSE')
 })
 it.each([null,[],[{},{}]])('rejects missing or ambiguous RPC rows %j',async(data)=>{
  const rpc=vi.fn().mockResolvedValue({data,error:null})
  await expect(createPlayerProgramService({rpc} as never).readSummary('p1','t1')).rejects.toThrow('MALFORMED_PROGRAM_SUMMARY_RESPONSE')
 })
 it('propagates access denial without a detailed fallback',async()=>{
  const error={code:'42501'};const rpc=vi.fn().mockResolvedValue({data:null,error})
  await expect(createPlayerProgramService({rpc} as never).readSummary('p1','t1')).rejects.toBe(error)
  expect(rpc).toHaveBeenCalledTimes(1)
 })
 })
