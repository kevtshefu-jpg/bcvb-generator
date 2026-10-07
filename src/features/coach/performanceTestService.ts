import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

export type PerformanceTestResult = {
  id:string; playerId:string; teamId:string; season:string; testCode:string; testName:string;
  measuredAt:string; value:number; unit:string; protocolVersion:string; contextNote:string|null;
  createdAt:string; updatedAt:string;
}
type Row=Record<string,unknown>
const str=(r:Row,k:string)=>{const v=r[k];if(typeof v!=='string'||!v)throw new Error('MALFORMED_PERFORMANCE_TEST_RESPONSE');return v}
export function mapPerformanceTestResult(value:unknown):PerformanceTestResult{
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('MALFORMED_PERFORMANCE_TEST_RESPONSE')
  const r=value as Row; const n=r.value
  if(typeof n!=='number'||!Number.isFinite(n))throw new Error('MALFORMED_PERFORMANCE_TEST_RESPONSE')
  return {id:str(r,'result_id'),playerId:str(r,'player_id'),teamId:str(r,'team_id'),season:str(r,'season'),
    testCode:str(r,'test_code'),testName:str(r,'test_name'),measuredAt:str(r,'measured_at'),value:n,unit:str(r,'unit'),
    protocolVersion:str(r,'protocol_version'),contextNote:typeof r.context_note==='string'?r.context_note:null,
    createdAt:str(r,'created_at'),updatedAt:str(r,'updated_at')}
}
export function createPerformanceTestService(client:SupabaseClient){
 return {
  async readPlayer(playerId:string,teamId:string){
    const {data,error}=await client.rpc('read_player_performance_tests',{target_player_id:playerId,target_team_id:teamId})
    if(error)throw error
    return (Array.isArray(data)?data:[]).map(mapPerformanceTestResult)
  },
  async save(input:Omit<PerformanceTestResult,'id'|'createdAt'|'updatedAt'>){
    const {data,error}=await client.rpc('save_player_performance_test',{
      target_player_id:input.playerId,target_team_id:input.teamId,target_season:input.season,target_test_code:input.testCode,
      target_test_name:input.testName,target_measured_at:input.measuredAt,target_value:input.value,target_unit:input.unit,
      target_protocol_version:input.protocolVersion,target_context_note:input.contextNote,
    })
    if(error)throw error
    if(typeof data!=='string'||!data)throw new Error('PERFORMANCE_TEST_SAVE_NOT_CONFIRMED')
    return data
  }
 }
}
export const performanceTestService=createPerformanceTestService(supabase)
