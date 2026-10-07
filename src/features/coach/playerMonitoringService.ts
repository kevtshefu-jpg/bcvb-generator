import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
export type Availability='normal'|'adaptee'|'arret'
export type MonitoringEntry={id:string;playerId:string;teamId:string;season:string;monitoredOn:string;sessionRpe:number|null;sessionDurationMinutes:number|null;fatigue:number|null;soreness:number|null;sleepQuality:number|null;pain:number|null;availability:Availability;note:string|null;createdAt:string;updatedAt:string}
type Row=Record<string,unknown>
const s=(r:Row,k:string)=>{if(typeof r[k]!=='string'||!r[k])throw new Error('MALFORMED_MONITORING_RESPONSE');return r[k] as string}
const n=(r:Row,k:string)=>r[k]===null?null:(typeof r[k]==='number'&&Number.isFinite(r[k] as number)?r[k] as number:(()=>{throw new Error('MALFORMED_MONITORING_RESPONSE')})())
export function mapMonitoringEntry(v:unknown):MonitoringEntry{if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('MALFORMED_MONITORING_RESPONSE');const r=v as Row;const a=s(r,'availability');if(!['normal','adaptee','arret'].includes(a))throw new Error('MALFORMED_MONITORING_RESPONSE');return{id:s(r,'entry_id'),playerId:s(r,'player_id'),teamId:s(r,'team_id'),season:s(r,'season'),monitoredOn:s(r,'monitored_on'),sessionRpe:n(r,'session_rpe'),sessionDurationMinutes:n(r,'session_duration_minutes'),fatigue:n(r,'fatigue'),soreness:n(r,'soreness'),sleepQuality:n(r,'sleep_quality'),pain:n(r,'pain'),availability:a as Availability,note:typeof r.note==='string'?r.note:null,createdAt:s(r,'created_at'),updatedAt:s(r,'updated_at')}}
export const sessionLoad=(rpe:number|null,duration:number|null)=>rpe===null||duration===null?null:rpe*duration
export function createPlayerMonitoringService(client:SupabaseClient){return{
 async readPlayer(playerId:string,teamId:string){const {data,error}=await client.rpc('read_player_monitoring',{target_player_id:playerId,target_team_id:teamId});if(error)throw error;return(Array.isArray(data)?data:[]).map(mapMonitoringEntry)},
 async save(i:Omit<MonitoringEntry,'id'|'createdAt'|'updatedAt'>){const {data,error}=await client.rpc('save_player_monitoring',{target_player_id:i.playerId,target_team_id:i.teamId,target_season:i.season,target_monitored_on:i.monitoredOn,target_session_rpe:i.sessionRpe,target_session_duration_minutes:i.sessionDurationMinutes,target_fatigue:i.fatigue,target_soreness:i.soreness,target_sleep_quality:i.sleepQuality,target_pain:i.pain,target_availability:i.availability,target_note:i.note});if(error)throw error;if(typeof data!=='string'||!data)throw new Error('MONITORING_SAVE_NOT_CONFIRMED');return data}
}}
export const playerMonitoringService=createPlayerMonitoringService(supabase)
