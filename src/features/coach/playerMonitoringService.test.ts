import { describe, expect, it, vi } from 'vitest'
import { createPlayerMonitoringService, mapMonitoringEntry, mapMonitoringSummary, sessionLoad } from './playerMonitoringService'

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

describe('minimal monitoring summary',()=>{
 it('loads the minimal RPC with canonical scope',async()=>{const rpc=vi.fn().mockResolvedValue({data:[{entry_count:2,last_monitored_on:'2026-10-08',note:'PRIVATE'}],error:null});const service=createPlayerMonitoringService({rpc} as never);await expect(service.readSummary('p1','t1')).resolves.toEqual({entryCount:2,lastMonitoredOn:'2026-10-08'});expect(rpc).toHaveBeenCalledWith('read_player_monitoring_summary',{target_player_id:'p1',target_team_id:'t1'})})
 it('accepts a genuinely empty source',()=>expect(mapMonitoringSummary({entry_count:0,last_monitored_on:null})).toEqual({entryCount:0,lastMonitoredOn:null}))
 it('propagates a denied source',async()=>{const error={code:'42501'};const service=createPlayerMonitoringService({rpc:vi.fn().mockResolvedValue({data:null,error})} as never);await expect(service.readSummary('p1','t1')).rejects.toEqual(error)})
 it.each([null,[],{}, {entry_count:-1,last_monitored_on:null},{entry_count:1.5,last_monitored_on:'2026-10-08'},{entry_count:2,last_monitored_on:null},{entry_count:0,last_monitored_on:'2026-10-08'}])('rejects malformed or inconsistent summaries',v=>expect(()=>mapMonitoringSummary(v)).toThrow('MALFORMED_MONITORING_SUMMARY_RESPONSE'))
 it.each([null,[],[{},{}]])('rejects missing/multiple RPC rows',async data=>{const service=createPlayerMonitoringService({rpc:vi.fn().mockResolvedValue({data,error:null})} as never);await expect(service.readSummary('p1','t1')).rejects.toThrow('MALFORMED_MONITORING_SUMMARY_RESPONSE')})
})
