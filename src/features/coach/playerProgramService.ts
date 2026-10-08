import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

export type PlayerProgramSummary = {programCount:number;activeProgramCount:number}
export function mapPlayerProgramSummary(value:unknown):PlayerProgramSummary {
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('MALFORMED_PROGRAM_SUMMARY_RESPONSE')
 const r=value as Record<string,unknown>; const total=r.program_count; const active=r.active_program_count
 if(typeof total!=='number'||!Number.isSafeInteger(total)||total<0||typeof active!=='number'||!Number.isSafeInteger(active)||active<0||active>total)throw new Error('MALFORMED_PROGRAM_SUMMARY_RESPONSE')
 return {programCount:total,activeProgramCount:active}
}
export const PROGRAM_PHASES=['diagnostic_apprentissage','consolidation','surcharge','complexification_conversion','intensification_match','affutage'] as const
export type ProgramPhase=typeof PROGRAM_PHASES[number]
export type ProgramSession={id:string;sessionId:string;orderIndex:number;plannedOn:string|null}
export type ProgramWeek={id:string;weekNumber:number;phase:ProgramPhase;startsOn:string;endsOn:string;sessions:ProgramSession[]}
export type PlayerProgram={id:string;playerId:string;teamId:string;season:string;title:string;startDate:string;endDate:string;level:1|2|3;status:'draft'|'active'|'completed'|'cancelled';safetyState:'vert'|'orange'|'rouge';weeks:ProgramWeek[]}
type Row=Record<string,unknown>
const str=(r:Row,k:string)=>{const v=r[k];if(typeof v!=='string'||!v)throw new Error('MALFORMED_PROGRAM_RESPONSE');return v}
const int=(r:Row,k:string)=>{const v=r[k];if(typeof v!=='number'||!Number.isInteger(v))throw new Error('MALFORMED_PROGRAM_RESPONSE');return v}
function session(v:unknown):ProgramSession{const r=v as Row;return{id:str(r,'id'),sessionId:str(r,'session_id'),orderIndex:int(r,'order_index'),plannedOn:typeof r.planned_on==='string'?r.planned_on:null}}
function week(v:unknown):ProgramWeek{const r=v as Row;const phase=str(r,'phase');if(!PROGRAM_PHASES.includes(phase as ProgramPhase))throw new Error('MALFORMED_PROGRAM_RESPONSE');return{id:str(r,'id'),weekNumber:int(r,'week_number'),phase:phase as ProgramPhase,startsOn:str(r,'starts_on'),endsOn:str(r,'ends_on'),sessions:Array.isArray(r.sessions)?r.sessions.map(session):[]}}
export function mapPlayerProgram(v:unknown):PlayerProgram{if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('MALFORMED_PROGRAM_RESPONSE');const r=v as Row;const level=int(r,'level');const status=str(r,'status');const safety=str(r,'safety_state');if(![1,2,3].includes(level)||!['draft','active','completed','cancelled'].includes(status)||!['vert','orange','rouge'].includes(safety))throw new Error('MALFORMED_PROGRAM_RESPONSE');return{id:str(r,'id'),playerId:str(r,'player_id'),teamId:str(r,'team_id'),season:str(r,'season'),title:str(r,'title'),startDate:str(r,'start_date'),endDate:str(r,'end_date'),level:level as 1|2|3,status:status as PlayerProgram['status'],safetyState:safety as PlayerProgram['safetyState'],weeks:Array.isArray(r.weeks)?r.weeks.map(week):[]}}
export function createPlayerProgramService(client:SupabaseClient){return{
 async readSummary(playerId:string,teamId:string):Promise<PlayerProgramSummary>{
  const {data,error}=await client.rpc('read_player_program_summary',{target_player_id:playerId,target_team_id:teamId})
  if(error)throw error
  if(!Array.isArray(data)||data.length!==1)throw new Error('MALFORMED_PROGRAM_SUMMARY_RESPONSE')
  return mapPlayerProgramSummary(data[0])
 },
 async readPlayer(playerId:string,teamId:string){const {data,error}=await client.rpc('read_player_programs',{target_player_id:playerId,target_team_id:teamId});if(error)throw error;return(Array.isArray(data)?data:[]).map(mapPlayerProgram)}}}
export const playerProgramService=createPlayerProgramService(supabase)
