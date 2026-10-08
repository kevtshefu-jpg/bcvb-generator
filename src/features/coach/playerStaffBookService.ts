import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { assertPlayerBookScope, type PlayerBookSnapshot } from './playerBookAggregation'

export function mapStaffBook(data:unknown,playerId:string):PlayerBookSnapshot {
 const fail=()=>{throw new Error('MALFORMED_STAFF_BOOK_RESPONSE')}
 if(!data||typeof data!=='object'||Array.isArray(data))return fail()
 const b=data as PlayerBookSnapshot
 assertPlayerBookScope(b)
 if(b.player.id!==playerId||!Array.isArray(b.monitoring)||b.monitoring.length!==0)return fail()
 for(const value of [b.evaluationCount,b.activeObjectiveCount])if(!Number.isSafeInteger(value)||value<0)return fail()
 for(const value of [b.player.firstName,b.player.lastName,b.player.teamName,b.generatedAt])if(typeof value!=='string'||!value.trim())return fail()
 for(const t of b.tests)if(typeof t.value!=='number'||!Number.isFinite(t.value)||[t.testName,t.unit,t.measuredAt,t.protocolVersion].some(v=>typeof v!=='string'||!v))return fail()
 for(const p of b.programs)if(![1,2,3].includes(p.level)||!['draft','active','completed','cancelled'].includes(p.status)||[p.title,p.startDate,p.endDate].some(v=>typeof v!=='string'||!v))return fail()
 // Allowlist the response: never retain unrelated private fields.
 if(!Array.isArray(b.objectives))return fail()
 for(const o of b.objectives){
  if([o.id,o.title,o.domain,o.targetDescription,o.observableCriterion].some(v=>typeof v!=='string'||!v)||!['a_travailler','en_cours','valide','abandonne'].includes(o.status))return fail()
  if([o.quantifiableCriterion,o.deadline].some(v=>v!==null&&typeof v!=='string'))return fail()
 }
 if(b.objectives.filter(o=>o.status==='a_travailler'||o.status==='en_cours').length!==b.activeObjectiveCount)return fail()
 return {player:{id:b.player.id,teamId:b.player.teamId,season:b.player.season,firstName:b.player.firstName,lastName:b.player.lastName,teamName:b.player.teamName},evaluationCount:b.evaluationCount,activeObjectiveCount:b.activeObjectiveCount,generatedAt:b.generatedAt,monitoring:[],
  objectives:b.objectives.map(o=>({id:o.id,playerId:o.playerId,teamId:o.teamId,season:o.season,title:o.title,domain:o.domain,targetDescription:o.targetDescription,observableCriterion:o.observableCriterion,quantifiableCriterion:o.quantifiableCriterion,deadline:o.deadline,status:o.status})),
  tests:b.tests.map(t=>({playerId:t.playerId,teamId:t.teamId,season:t.season,testName:t.testName,value:t.value,unit:t.unit,measuredAt:t.measuredAt,protocolVersion:t.protocolVersion})),
  programs:b.programs.map(p=>({playerId:p.playerId,teamId:p.teamId,season:p.season,title:p.title,startDate:p.startDate,endDate:p.endDate,level:p.level,status:p.status}))}
}
export function createPlayerStaffBookService(client:SupabaseClient){return{
 async read(playerId:string){const {data,error}=await client.rpc('read_player_staff_book',{target_player_id:playerId});if(error)throw error;return mapStaffBook(data,playerId)}
}}
export const playerStaffBookService=createPlayerStaffBookService(supabase)
