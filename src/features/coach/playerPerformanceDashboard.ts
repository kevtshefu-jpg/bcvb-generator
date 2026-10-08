import type { PlayerProgressionProfile } from './playerProgressionService'
import type { PerformanceTestSummary } from './performanceTestService'
import type { MonitoringSummary } from './playerMonitoringService'
import type { PlayerProgramSummary } from './playerProgramService'
export type PlayerPerformanceDashboardModel={evaluationCount:number;activeObjectiveCount:number;testCount:number|null;lastTestDate:string|null;monitoringCount:number|null;lastMonitoringDate:string|null;programCount:number|null;activeProgramCount:number|null}
export function buildPlayerPerformanceDashboard(profile:PlayerProgressionProfile,tests:PerformanceTestSummary|null,monitoring:MonitoringSummary|null,programs:PlayerProgramSummary|null):PlayerPerformanceDashboardModel {
 return {evaluationCount:profile.evaluationCount,activeObjectiveCount:profile.activeObjectiveCount,
  testCount:tests?.testCount??null,lastTestDate:tests?.lastTestDate??null,
  monitoringCount:monitoring?.entryCount??null,lastMonitoringDate:monitoring?.lastMonitoredOn??null,
  programCount:programs?.programCount??null,activeProgramCount:programs?.activeProgramCount??null}
}
