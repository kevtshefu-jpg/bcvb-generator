import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import type { IndividualObjective } from '../../types/evaluations'

export type StoredPlayerObjective = IndividualObjective & { teamId: string; season: string; createdAt: string; updatedAt: string }
type Row = Record<string, unknown>
function str(row: Row, key: string) { const value=row[key]; if(typeof value!=='string'||!value) throw new Error('MALFORMED_PLAYER_OBJECTIVE_RESPONSE'); return value }

export function mapPlayerObjective(value: unknown): StoredPlayerObjective {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('MALFORMED_PLAYER_OBJECTIVE_RESPONSE')
  const row=value as Row
  return {
    id:str(row,'objective_id'), playerId:str(row,'player_id'), teamId:str(row,'team_id'), season:str(row,'season'),
    title:str(row,'title'), domain:str(row,'domain') as IndividualObjective['domain'],
    targetDescription:str(row,'target_description'), observableCriterion:str(row,'observable_criterion'),
    quantifiableCriterion:typeof row.quantifiable_criterion==='string'?row.quantifiable_criterion:undefined,
    deadline:typeof row.deadline==='string'?row.deadline:undefined,
    status:str(row,'status') as IndividualObjective['status'],
    linkedSessionIds:Array.isArray(row.linked_session_ids)?row.linked_session_ids.filter((x):x is string=>typeof x==='string'):[],
    createdAt:str(row,'created_at'), updatedAt:str(row,'updated_at'),
  }
}

export function createPlayerObjectiveService(client: SupabaseClient) {
  return {
    async readPlayer(playerId:string, teamId:string):Promise<StoredPlayerObjective[]> {
      const {data,error}=await client.rpc('read_player_objectives',{target_player_id:playerId,target_team_id:teamId})
      if(error) throw error
      if(!Array.isArray(data)) throw new Error('MALFORMED_PLAYER_OBJECTIVE_RESPONSE')
      return data.map(mapPlayerObjective)
    },
    async save(objective:IndividualObjective, teamId:string, season:string):Promise<string> {
      const {data,error}=await client.rpc('save_player_objective',{
        target_objective_id:/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(objective.id)?objective.id:null,
        target_player_id:objective.playerId,target_team_id:teamId,target_season:season,target_title:objective.title,
        target_domain:objective.domain,target_description:objective.targetDescription,target_observable_criterion:objective.observableCriterion,
        target_quantifiable_criterion:objective.quantifiableCriterion??'',target_deadline:objective.deadline??'',target_status:objective.status,
        target_linked_session_ids:objective.linkedSessionIds??objective.linkedSessions??[],
      })
      if(error) throw error
      if(typeof data!=='string'||!data) throw new Error('PLAYER_OBJECTIVE_SAVE_NOT_CONFIRMED')
      return data
    },
  }
}
export const playerObjectiveService=createPlayerObjectiveService(supabase)
