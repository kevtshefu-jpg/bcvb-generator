import { describe, expect, it, vi } from 'vitest'
import { createPlayerMonitoringService, mapMonitoringEntry, sessionLoad } from './playerMonitoringService'

const row={entry_id:'e1',player_id:'p1',team_id:'t1',season:'2026-2027',monitored_on:'2026-10-07',session_rpe:7,session_duration_minutes:90,fatigue:5,soreness:2,sleep_quality:7,pain:0,availability:'normal',note:null,created_at:'2026-10-07T00:00:00Z',updated_at:'2026-10-07T00:00:00Z'}
describe('playerMonitoringService',()=>{
 it('calcule la charge sRPE factuelle',()=>expect(sessionLoad(7,90)).toBe(630))
 it('ne fabrique pas une charge incomplète',()=>expect(sessionLoad(null,90)).toBeNull())
 it('mappe sans interprétation médicale',()=>expect(mapMonitoringEntry(row)).toMatchObject({pain:0,availability:'normal'}))
 it('lit via la RPC canonique',async()=>{const rpc=vi.fn().mockResolvedValue({data:[row],error:null});const service=createPlayerMonitoringService({rpc} as never);await expect(service.readPlayer('p1','t1')).resolves.toHaveLength(1)})
 it('propage un refus RPC au lieu de simuler un suivi vide',async()=>{const error={code:'42501',message:'Lecture monitoring interdite.'};const service=createPlayerMonitoringService({rpc:vi.fn().mockResolvedValue({data:null,error})} as never);await expect(service.readPlayer('p1','t1')).rejects.toEqual(error)})
 it('refuse une réponse malformée',async()=>{const service=createPlayerMonitoringService({rpc:vi.fn().mockResolvedValue({data:null,error:null})} as never);await expect(service.readPlayer('p1','t1')).rejects.toThrow('MALFORMED_MONITORING_RESPONSE')})
 it('propage un refus de sauvegarde',async()=>{const error={code:'42501'};const service=createPlayerMonitoringService({rpc:vi.fn().mockResolvedValue({data:null,error})} as never);await expect(service.save(mapMonitoringEntry(row))).rejects.toEqual(error)})
})
