import type {
  AnnualPlanning,
  CoachProfile,
  PlanningBuilderInput,
  PlanningCategory,
  PlanningCycle,
  PlanningLevel,
  PlanningObjective,
  PlanningWeek,
} from "../../types/planning";
import { CATEGORY_STANDARDS, getCoachAdjustment, getLevelFocus } from "./planningStandards";

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function withIds(objectives: Array<Omit<PlanningObjective, "id">>): PlanningObjective[] {
  return objectives.map((objective) => ({ ...objective, id: createId("obj") }));
}

function buildCycleObjective(category: PlanningCategory, level: PlanningLevel, theme: string, index: number): PlanningObjective {
  const standard = CATEGORY_STANDARDS[category];
  return {
    id: createId("obj"),
    label: theme,
    description: `${theme} adapté au niveau ${level}. ${standard.ageFocus}`,
    priority: index < 2 ? "haute" : "moyenne",
    observableCriteria: [
      `Le thème "${theme}" est visible sur les situations de la semaine.`,
      "Le coach peut citer une réussite et une correction prioritaires.",
      "Le transfert match est identifié ou préparé.",
    ],
    quantifiableCriteria: [
      "70% d’actions alignées sur la consigne prioritaire",
      "1 indicateur suivi chaque semaine",
    ],
    bcvbLink: index % 2 === 0 ? "Défendre Fort" : "Courir / Partager",
  };
}

function buildWeek({
  category,
  level,
  coachProfile,
  cycleTheme,
  weekNumber,
  cycleIndex,
}: {
  category: PlanningCategory;
  level: PlanningLevel;
  coachProfile: CoachProfile;
  cycleTheme: string;
  weekNumber: number;
  cycleIndex: number;
}): PlanningWeek {
  const standard = CATEGORY_STANDARDS[category];
  const themePool = standard.dominantThemes;
  const weeklyTheme = themePool[(weekNumber + cycleIndex) % themePool.length];
  const objective = buildCycleObjective(category, level, weeklyTheme, cycleIndex);

  return {
    id: createId("week"),
    weekNumber,
    dateLabel: `S${weekNumber}`,
    theme: weeklyTheme,
    priority: cycleTheme,
    objectives: [objective],
    linkedSessionIds: [],
    coachNotes: `${getCoachAdjustment(coachProfile)}.`,
    technicalManagerNotes: "",
    validationCriteria: [
      `${weeklyTheme} observé sur situation jouée`,
      `${getLevelFocus(level)} pris en compte`,
      "Lien BCVB explicité aux joueurs",
    ],
  };
}

function buildCycle({
  category,
  level,
  coachProfile,
  theme,
  index,
  startWeek,
  durationWeeks,
}: {
  category: PlanningCategory;
  level: PlanningLevel;
  coachProfile: CoachProfile;
  theme: string;
  index: number;
  startWeek: number;
  durationWeeks: number;
}): PlanningCycle {
  const weeks = Array.from({ length: durationWeeks }, (_, weekIndex) => buildWeek({
    category,
    level,
    coachProfile,
    cycleTheme: theme,
    weekNumber: startWeek + weekIndex,
    cycleIndex: index,
  }));
  const objective = buildCycleObjective(category, level, theme, index);

  return {
    id: createId("cycle"),
    title: `Cycle ${index + 1} - ${theme}`,
    durationWeeks,
    startWeek,
    endWeek: startWeek + durationWeeks - 1,
    theme,
    bcvbPriority: index % 3 === 0 ? "Défendre Fort" : index % 3 === 1 ? "Courir" : "Partager la balle",
    objectives: [objective],
    weeks,
    status: index === 0 ? "en cours" : "brouillon",
    locked: false,
  };
}

export function buildPlanningCycles(input: PlanningBuilderInput, weeksCount = 30): PlanningCycle[] {
  const standard = CATEGORY_STANDARDS[input.category];
  const durations = [4, 5, 5, 4, 6, 6];
  const cycles: PlanningCycle[] = [];
  let currentWeek = 1;
  let index = 0;

  while (currentWeek <= weeksCount) {
    const durationWeeks = Math.min(durations[index % durations.length], weeksCount - currentWeek + 1);
    const theme = standard.cycleThemes[index % standard.cycleThemes.length];
    cycles.push(buildCycle({
      category: input.category,
      level: input.level,
      coachProfile: input.coachProfile,
      theme,
      index,
      startWeek: currentWeek,
      durationWeeks,
    }));
    currentWeek += durationWeeks;
    index += 1;
  }

  return cycles;
}

export function createAnnualPlanning(input: PlanningBuilderInput): AnnualPlanning {
  const standard = CATEGORY_STANDARDS[input.category];
  const now = new Date().toISOString();
  const globalObjectives = withIds(standard.defaultObjectives);

  return {
    id: createId("planning"),
    title: `Planification ${input.teamName || input.category} - ${input.season}`,
    category: input.category,
    level: input.level,
    coachProfile: input.coachProfile,
    teamName: input.teamName,
    season: input.season,
    trainingFrequencyPerWeek: input.trainingFrequencyPerWeek,
    matchLevel: input.matchLevel,
    constraints: input.constraints,
    globalObjectives,
    cycles: buildPlanningCycles(input),
    status: "brouillon",
    createdBy: input.createdBy || "BCVB",
    updatedAt: now,
    versions: [],
  };
}

export function updatePlanningTimestamp(planning: AnnualPlanning): AnnualPlanning {
  return { ...planning, updatedAt: new Date().toISOString() };
}

export function duplicateCycle(cycle: PlanningCycle, startWeek: number): PlanningCycle {
  const clonedWeeks = cycle.weeks.map((week, index) => ({
    ...week,
    id: createId("week"),
    weekNumber: startWeek + index,
    dateLabel: `S${startWeek + index}`,
  }));

  return {
    ...cycle,
    id: createId("cycle"),
    title: `${cycle.title} - copie`,
    startWeek,
    endWeek: startWeek + cycle.durationWeeks - 1,
    status: "brouillon",
    locked: false,
    weeks: clonedWeeks,
  };
}

export function createPlanningVersion(planning: AnnualPlanning, comment: string, createdBy = "BCVB") {
  return {
    id: createId("version"),
    createdAt: new Date().toISOString(),
    createdBy,
    comment,
    snapshot: { ...planning, versions: [] },
  };
}
