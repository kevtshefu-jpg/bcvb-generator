import type { PlayerProgressionProfile } from './playerProgressionService'
import type { PerformanceTestResult } from './performanceTestService'
import type { MonitoringEntry } from './playerMonitoringService'
import type { PlayerProgram } from './playerProgramService'
export type PlayerPerformanceDashboardModel={evaluationCount:number;activeObjectiveCount:number;testCount:number;lastTestDate:string|null;monitoringCount:number;lastMonitoringDate:string|null;programCount:number;activeProgramCount:number}
const latest=(values:string[])=>{if(!values.length)return null;const sorted=[...values].sort();return sorted[sorted.length-1]??null}
export function buildPlayerPerformanceDashboard(profile:PlayerProgressionProfile,tests:PerformanceTestResult[],monitoring:MonitoringEntry[],programs:PlayerProgram[]):PlayerPerformanceDashboardModel{return{evaluationCount:profile.evaluationCount,activeObjectiveCount:profile.activeObjectiveCount,testCount:tests.length,lastTestDate:latest(tests.map(v=>v.measuredAt)),monitoringCount:monitoring.length,lastMonitoringDate:latest(monitoring.map(v=>v.monitoredOn)),programCount:programs.length,activeProgramCount:programs.filter(v=>v.status==='active').length}}