import {describe,expect,it,vi} from 'vitest'
import {createPerformanceTestService,mapPerformanceTestResult} from './performanceTestService'
const row={result_id:'r1',player_id:'p1',team_id:'t1',season:'2026-2027',test_code:'SPRINT10',test_name:'Sprint 10 m',measured_at:'2026-10-07',value:1.92,unit:'s',protocol_version:'BCVB-v1',context_note:null,created_at:'2026-10-07T00:00:00Z',updated_at:'2026-10-07T00:00:00Z'}
describe('performanceTestService',()=>{
 it('mappe un résultat canonique sans interpréter sa performance',()=>expect(mapPerformanceTestResult(row)).toMatchObject({testCode:'SPRINT10',value:1.92,unit:'s'}))
 it('refuse une valeur non numérique',()=>expect(()=>mapPerformanceTestResult({...row,value:'1.92'})).toThrow('MALFORMED_PERFORMANCE_TEST_RESPONSE'))
 it('lit par RPC dédiée',async()=>{const rpc=vi.fn().mockResolvedValue({data:[row],error:null});const s=createPerformanceTestService({rpc} as never);await expect(s.readPlayer('p1','t1')).resolves.toHaveLength(1);expect(rpc).toHaveBeenCalledWith('read_player_performance_tests',{target_player_id:'p1',target_team_id:'t1'})})
})
 describe('dashboard summary',()=>{
 it('requests only aggregates and strips unrelated details',async()=>{
  const rpc=vi.fn().mockResolvedValue({data:[{test_count:2,last_measured_at:'2026-10-08',context_note:'PRIVATE',value:99}],error:null})
  await expect(createPerformanceTestService({rpc} as never).readSummary('p1','t1')).resolves.toEqual({testCount:2,lastTestDate:'2026-10-08'})
  expect(rpc).toHaveBeenCalledExactlyOnceWith('read_player_performance_test_summary',{target_player_id:'p1',target_team_id:'t1'})
 })
 it.each([null,[],{}, {test_count:-1,last_measured_at:null}, {test_count:0,last_measured_at:'2026-10-08'}, {test_count:1,last_measured_at:null}, {test_count:'2',last_measured_at:'2026-10-08'}, {test_count:1.5,last_measured_at:'2026-10-08'}, {test_count:1,last_measured_at:'invalid'}])('rejects malformed summary %j',async(value)=>{
  const rpc=vi.fn().mockResolvedValue({data:[value],error:null})
  await expect(createPerformanceTestService({rpc} as never).readSummary('p1','t1')).rejects.toThrow('MALFORMED_PERFORMANCE_TEST_SUMMARY_RESPONSE')
 })
 it.each([null,[],[{},{}]])('rejects missing or ambiguous RPC rows %j',async(data)=>{
  const rpc=vi.fn().mockResolvedValue({data,error:null})
  await expect(createPerformanceTestService({rpc} as never).readSummary('p1','t1')).rejects.toThrow('MALFORMED_PERFORMANCE_TEST_SUMMARY_RESPONSE')
 })
 it('propagates access denial without a detailed fallback',async()=>{
  const error={code:'42501'};const rpc=vi.fn().mockResolvedValue({data:null,error})
  await expect(createPerformanceTestService({rpc} as never).readSummary('p1','t1')).rejects.toBe(error)
  expect(rpc).toHaveBeenCalledTimes(1)
 })
 })
