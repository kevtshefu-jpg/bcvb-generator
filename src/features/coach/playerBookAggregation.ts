import type { PlayerProgressionProfile } from './playerProgressionService'
import type { PlayerProgram } from './playerProgramService'
import type { MonitoringEntry } from './playerMonitoringService'
import type { PerformanceTestResult } from './performanceTestService'

export type PlayerBookSnapshot={
 player:{id:string;firstName:string;lastName:string;teamId:string;teamName:string;season:string}
 evaluationCount:number
 activeObjectiveCount:number
 tests:PerformanceTestResult[]
 monitoring:MonitoringEntry[]
 programs:PlayerProgram[]
 generatedAt:string
}
// Integrity guard, not an access grant: source reads must already be authorized.
export function assertPlayerBookScope(snapshot:PlayerBookSnapshot):void {
 const scope=snapshot?.player
 if(!scope || [scope.id,scope.teamId,scope.season].some(value=>typeof value!=='string'||!value.trim())) {
  throw new Error('PLAYER_BOOK_SCOPE_MISSING')
 }
 for(const entries of [snapshot.tests,snapshot.monitoring,snapshot.programs]) {
  if(!Array.isArray(entries))throw new Error('PLAYER_BOOK_SOURCE_MALFORMED')
  for(const entry of entries) {
   if(!entry || entry.playerId!==scope.id || entry.teamId!==scope.teamId || entry.season!==scope.season) {
    throw new Error('PLAYER_BOOK_SOURCE_SCOPE_MISMATCH')
   }
  }
 }
}
export function buildPlayerBookSnapshot(input:{profile:PlayerProgressionProfile;tests:PerformanceTestResult[];monitoring:MonitoringEntry[];programs:PlayerProgram[];generatedAt?:string}):PlayerBookSnapshot{
 const {profile}=input
 const snapshot:PlayerBookSnapshot={player:{id:profile.playerId,teamId:profile.teamId,firstName:profile.firstName,lastName:profile.lastName,teamName:profile.teamName,season:profile.season},evaluationCount:profile.evaluationCount,activeObjectiveCount:profile.activeObjectiveCount,tests:[...input.tests],monitoring:[...input.monitoring],programs:[...input.programs],generatedAt:input.generatedAt??new Date().toISOString()}
 assertPlayerBookScope(snapshot)
 return snapshot
}
