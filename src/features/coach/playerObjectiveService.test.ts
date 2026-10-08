import { describe, expect, it, vi } from 'vitest'
import { createPlayerObjectiveService, mapPlayerObjective } from './playerObjectiveService'
const row={objective_id:'o1',player_id:'p1',team_id:'t1',season:'2026-2027',title:'Premier pas',domain:'physique',target_description:'Accélérer',observable_criterion:'Créer un avantage',quantifiable_criterion:'',deadline:'4 semaines',status:'en_cours',linked_session_ids:[],created_at:'2026-10-07T00:00:00Z',updated_at:'2026-10-07T00:00:00Z'}
describe('playerObjectiveService',()=>{
 it.each([null,undefined,{},'invalid'])('refuse une liste malformée %j',async(data)=>{
  const rpc=vi.fn().mockResolvedValue({data,error:null})
  await expect(createPlayerObjectiveService({rpc} as never).readPlayer('p','t')).rejects.toThrow('MALFORMED_PLAYER_OBJECTIVE_RESPONSE')
 })
 it('préserve une vraie liste vide',async()=>{
  const rpc=vi.fn().mockResolvedValue({data:[],error:null})
  await expect(createPlayerObjectiveService({rpc} as never).readPlayer('p','t')).resolves.toEqual([])
 })
 it('propage un refus sans autre lecture',async()=>{
  const error={code:'42501'};const rpc=vi.fn().mockResolvedValue({data:null,error})
  await expect(createPlayerObjectiveService({rpc} as never).readPlayer('p','t')).rejects.toBe(error)
  expect(rpc).toHaveBeenCalledTimes(1)
 })
 it('mappe le contrat serveur',()=>expect(mapPlayerObjective(row)).toMatchObject({id:'o1',playerId:'p1',teamId:'t1',status:'en_cours'}))
 it('lit via la RPC dédiée',async()=>{const rpc=vi.fn().mockResolvedValue({data:[row],error:null});const service=createPlayerObjectiveService({rpc} as never);await expect(service.readPlayer('p1','t1')).resolves.toHaveLength(1);expect(rpc).toHaveBeenCalledWith('read_player_objectives',{target_player_id:'p1',target_team_id:'t1'})})
})
