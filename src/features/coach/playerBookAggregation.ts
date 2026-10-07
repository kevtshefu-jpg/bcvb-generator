import type { PlayerProgressionProfile } from './playerProgressionService'
import type { PlayerProgram } from './playerProgramService'
import type { PlayerMonitoringEntry } from './playerMonitoringService'
import type { PerformanceTestResult } from './performanceTestService'

export type PlayerBookSnapshot={
 player:{id:string;firstName:string;lastName:string;teamName:string;season:string}
 evaluationCount:number
 activeObjectiveCount:number
 tests:PerformanceTestResult[]
 monitoring:PlayerMonitoringEntry[]
 programs:PlayerProgram[]
 generatedAt:string
}
export function buildPlayerBookSnapshot(input:{profile:PlayerProgressionProfile;tests:PerformanceTestResult[];monitoring:PlayerMonitoringEntry[];programs:PlayerProgram[];generatedAt?:string}):PlayerBookSnapshot{
 const {profile}=input
 return{player:{id:profile.playerId,firstName:profile.firstName,lastName:profile.lastName,teamName:profile.teamName,season:profile.season},evaluationCount:profile.evaluationCount,activeObjectiveCount:profile.activeObjectiveCount,tests:[...input.tests],monitoring:[...input.monitoring],programs:[...input.programs],generatedAt:input.generatedAt??new Date().toISOString()}
}
