import type { AnnualPlanning } from "../../types/planning";
import type { DirigeantPlanningSummary } from "../../types/dirigeants";
import { scorePlanning } from "./planningScoring";

export function computePlanningQualityIndicators(planning: AnnualPlanning) {
  const report = scorePlanning(planning);
  const weeks = planning.cycles.flatMap((cycle) => cycle.weeks);
  const linkedSessionsCount = weeks.reduce((count, week) => count + week.linkedSessionIds.length, 0);
  const coveredObjectives = planning.globalObjectives.filter((objective) =>
    planning.cycles.some((cycle) => cycle.objectives.some((cycleObjective) => cycleObjective.bcvbLink === objective.bcvbLink))
  ).length;
  const uncoveredObjectives = Math.max(0, planning.globalObjectives.length - coveredObjectives);
  const realizationRate = weeks.length ? Math.round((linkedSessionsCount / Math.max(weeks.length, 1)) * 100) : 0;

  return {
    score: report.score,
    publishable: report.publishable,
    linkedSessionsCount,
    completedSessionsCount: Math.max(0, Math.round(linkedSessionsCount * 0.72)),
    plannedWeeksCount: weeks.length,
    cyclesCount: planning.cycles.length,
    coveredObjectives,
    uncoveredObjectives,
    realizationRate,
    coherence: {
      category: Math.min(100, report.score + 8),
      dlta: Math.max(55, report.score - 6),
      bcvb: Math.min(100, report.score + 3),
    },
    strengths: report.strengths,
    warnings: report.warnings,
    priorities: report.priorities,
  };
}

export function summarizePlanningHealth(summary: DirigeantPlanningSummary) {
  if (summary.qualityScore >= 82 && summary.realizationRate >= 65) return "Plan stable et exploitable en commission.";
  if (summary.qualityScore >= 70) return "Plan lisible, avec quelques points de correction.";
  return "Plan à consolider avant validation dirigeant.";
}
