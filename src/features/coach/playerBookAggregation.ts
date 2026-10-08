import type { PlayerProgressionProfile } from './playerProgressionService'
import type { PlayerProgram } from './playerProgramService'
import type { MonitoringEntry } from './playerMonitoringService'
import type { PerformanceTestResult } from './performanceTestService'

export type PlayerBookObjective={id:string;playerId:string;teamId:string;season:string;title:string;domain:string;targetDescription:string;observableCriterion:string;quantifiableCriterion:string|null;deadline:string|null;status:'a_travailler'|'en_cours'|'valide'|'abandonne'}
export const objectiveStatusLabel=(status:PlayerBookObjective['status'])=>({a_travailler:'À travailler',en_cours:'En cours',valide:'Validé',abandonne:'Abandonné'}[status])
export type PlayerBookSnapshot={
 player:{id:string;firstName:string;lastName:string;teamId:string;teamName:string;season:string}
 evaluationCount:number
 activeObjectiveCount:number
 objectives?:PlayerBookObjective[]
 tests:(Pick<PerformanceTestResult,'playerId'|'teamId'|'season'|'testName'|'value'|'unit'|'measuredAt'|'protocolVersion'> & Partial<PerformanceTestResult>)[]
 monitoring:MonitoringEntry[]
 programs:(Pick<PlayerProgram,'playerId'|'teamId'|'season'|'title'|'startDate'|'endDate'|'level'|'status'> & Partial<PlayerProgram>)[]
 generatedAt:string
}
// Integrity guard, not an access grant: source reads must already be authorized.
export function assertPlayerBookScope(snapshot:PlayerBookSnapshot):void {
 const scope=snapshot?.player
 if(!scope || [scope.id,scope.teamId,scope.season].some(value=>typeof value!=='string'||!value.trim())) {
  throw new Error('PLAYER_BOOK_SCOPE_MISSING')
 }
 for(const entries of [snapshot.tests,snapshot.monitoring,snapshot.programs,snapshot.objectives===undefined?[]:snapshot.objectives]) {
  if(!Array.isArray(entries))throw new Error('PLAYER_BOOK_SOURCE_MALFORMED')
  for(const entry of entries) {
   if(!entry || entry.playerId!==scope.id || entry.teamId!==scope.teamId || entry.season!==scope.season) {
    throw new Error('PLAYER_BOOK_SOURCE_SCOPE_MISMATCH')
   }
  }
 }
}
export function buildPlayerBookSnapshot(input:{profile:PlayerProgressionProfile;tests:PlayerBookSnapshot['tests'];monitoring:MonitoringEntry[];programs:PlayerBookSnapshot['programs'];objectives?:PlayerBookObjective[];generatedAt?:string}):PlayerBookSnapshot{
 const {profile}=input
 const snapshot:PlayerBookSnapshot={player:{id:profile.playerId,teamId:profile.teamId,firstName:profile.firstName,lastName:profile.lastName,teamName:profile.teamName,season:profile.season},evaluationCount:profile.evaluationCount,activeObjectiveCount:profile.activeObjectiveCount,tests:[...input.tests],monitoring:[...input.monitoring],programs:[...input.programs],generatedAt:input.generatedAt??new Date().toISOString()}
 assertPlayerBookScope(snapshot)
 if(input.objectives!==undefined){snapshot.objectives=[...input.objectives];assertPlayerBookScope(snapshot)}
 return snapshot
}
