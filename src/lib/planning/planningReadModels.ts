import type {
  AnnualPlanning,
  PlanningBuilderInput,
  PlanningCategory,
  PlanningLevel,
  PlanningStatus,
} from "../../types/planning";
import type {
  DirigeantComment,
  DirigeantDocumentSummary,
  DirigeantOrganisationSummary,
  DirigeantPlanningSummary,
  DirigeantQualityAlert,
  ValidationStatus,
} from "../../types/dirigeants";
import { getTeamDocuments, getTeamObjectives, getTeamStaff, teamProfiles } from "../teams/teamProfiles";
import { computeTeamIndicators } from "../teams/teamStats";
import { isHeadCoachRole } from "../teams/teamStaff";
import { createAnnualPlanning } from "./planningEngine";
import { computePlanningQualityIndicators } from "./planningQuality";

const planningCategories: PlanningCategory[] = ["U7", "U9", "U11", "U13", "U15", "U18", "U21", "Seniors", "Général BCVB"];
const planningLevels: PlanningLevel[] = ["Découverte", "Départemental", "Région", "Pré-région", "Performance", "Loisir", "Section sportive"];

const planningStatuses: PlanningStatus[] = ["en validation dirigeant", "proposée", "validée technique"];
const validationStatuses: ValidationStatus[] = ["in_dirigeant_validation", "ready_for_validation", "validated"];

export const dirigeantComments: DirigeantComment[] = [
  {
    id: "comment-plan-u13",
    targetId: "planning-u13-2026",
    targetType: "planning",
    authorId: "dir-1",
    authorName: "Commission sportive",
    role: "dirigeant",
    content: "Validation possible après ajout du lien vers les séances du cycle défense.",
    createdAt: "2026-06-02T09:30:00.000Z",
  },
  {
    id: "comment-doc-cadre",
    targetId: "doc-cadre-technique",
    targetType: "document",
    authorId: "dir-2",
    authorName: "Présidence BCVB",
    role: "dirigeant",
    content: "Document conforme pour diffusion club.",
    createdAt: "2026-06-01T17:15:00.000Z",
  },
];

function asPlanningCategory(category: string): PlanningCategory {
  return planningCategories.includes(category as PlanningCategory) ? category as PlanningCategory : "Général BCVB";
}

function asPlanningLevel(level: string): PlanningLevel {
  return planningLevels.includes(level as PlanningLevel) ? level as PlanningLevel : "Départemental";
}

function trainingSlotToText(slot: NonNullable<(typeof teamProfiles)[number]["trainingSlots"]>[number]) {
  return typeof slot === "string" ? slot : `${slot.day} ${slot.startTime}-${slot.endTime} · ${slot.gym}`;
}

function buildPlanningInput(teamIndex: number): PlanningBuilderInput {
  const team = teamProfiles[teamIndex];
  return {
    teamName: team.name,
    season: team.season,
    category: asPlanningCategory(team.category),
    level: asPlanningLevel(team.level),
    coachProfile: teamIndex === 0 ? "Responsable technique" : "Confirmé",
    trainingFrequencyPerWeek: team.trainingSlots?.length || 2,
    matchLevel: team.championship || team.level,
    constraints: [
      team.mainGym ? `Salle principale : ${team.mainGym}` : "Salle à confirmer",
      ...(team.trainingSlots || []).map(trainingSlotToText),
    ],
    createdBy: getTeamStaff(team.id).find((member) => isHeadCoachRole(member.role))?.name || "BCVB",
  };
}

export function getMockAnnualPlannings(): AnnualPlanning[] {
  return teamProfiles.map((team, index) => {
    const planning = createAnnualPlanning(buildPlanningInput(index));
    const sessionCount = getTeamDocuments(team.id).filter((document) => document.documentType === "session").length;
    const linkedCycles = planning.cycles.map((cycle, cycleIndex) => ({
      ...cycle,
      status: cycleIndex === 0 ? "en cours" as const : cycle.status,
      weeks: cycle.weeks.map((week, weekIndex) => ({
        ...week,
        linkedSessionIds: weekIndex < sessionCount + index ? [`session-${team.id}-${weekIndex + 1}`] : week.linkedSessionIds,
      })),
    }));

    return {
      ...planning,
      id: `planning-${team.id}-2026`,
      title: `Planification sportive ${team.name}`,
      teamName: team.name,
      status: planningStatuses[index] || "à valider",
      cycles: linkedCycles,
      updatedAt: `2026-06-0${index + 2}T10:00:00.000Z`,
    };
  });
}

export function getDirigeantPlanningSummaries(): DirigeantPlanningSummary[] {
  return getMockAnnualPlannings().map((planning, index) => {
    const team = teamProfiles[index];
    const staff = getTeamStaff(team.id);
    const objectives = getTeamObjectives(team.id);
    const documents = getTeamDocuments(team.id);
    const indicators = computeTeamIndicators(team, staff, objectives, documents);
    const quality = computePlanningQualityIndicators(planning);
    const headCoach = staff.find((member) => member.role === "head_coach" && member.isActive)?.name || "À affecter";
    const technicalManager = staff.find((member) => member.role === "technical_manager" && member.isActive)?.name || "Responsable technique BCVB";

    return {
      id: planning.id,
      title: planning.title,
      teamId: team.id,
      teamName: team.name,
      category: planning.category,
      level: planning.level,
      season: planning.season,
      coachName: headCoach,
      technicalManager,
      status: planning.status,
      validationStatus: validationStatuses[index] || "ready_for_validation",
      currentCycle: planning.cycles[0]?.title || "Cycle à définir",
      nextCycle: planning.cycles[1]?.title || "Cycle suivant à définir",
      mainObjectives: objectives.length ? objectives.slice(0, 3).map((objective) => objective.title) : planning.globalObjectives.slice(0, 3).map((objective) => objective.label),
      linkedSessionsCount: quality.linkedSessionsCount,
      completedSessionsCount: quality.completedSessionsCount,
      plannedWeeksCount: quality.plannedWeeksCount,
      cyclesCount: quality.cyclesCount,
      coveredObjectives: quality.coveredObjectives,
      uncoveredObjectives: quality.uncoveredObjectives,
      realizationRate: indicators.sessionsCreated ? Math.max(quality.realizationRate, Math.min(95, indicators.sessionsCreated * 4)) : quality.realizationRate,
      qualityScore: quality.score,
      coherence: quality.coherence,
      alerts: [...indicators.alerts, ...quality.warnings].slice(0, 4),
      comments: dirigeantComments.filter((comment) => comment.targetId === planning.id),
      exports: [
        { label: "Synthèse commission PDF", path: `/exports/${planning.id}.pdf`, type: "pdf" },
        { label: "Tableau cycles CSV", path: `/exports/${planning.id}.csv`, type: "csv" },
      ],
    };
  });
}

export function getDirigeantDocuments(): DirigeantDocumentSummary[] {
  return [
    {
      id: "doc-cadre-technique",
      title: "Cahier technique BCVB 2026-2027",
      family: "Cahier technique",
      category: "Formation joueur",
      status: "published",
      publicationLevel: "official",
      qualityScore: 92,
      updatedAt: "2026-06-01T09:00:00.000Z",
      route: "/bibliotheque",
    },
    {
      id: "doc-plan-formation",
      title: "Plan de formation U13-U15",
      family: "Plan de formation",
      category: "Organisation sportive",
      status: "in_dirigeant_validation",
      publicationLevel: "club",
      qualityScore: 81,
      updatedAt: "2026-06-03T13:40:00.000Z",
      route: "/bibliotheque",
    },
    {
      id: "doc-bilan-presences",
      title: "Bilan présences trimestre 2",
      family: "Bilan équipe",
      category: "Pilotage sportif",
      status: "to_correct",
      publicationLevel: "internal",
      qualityScore: 66,
      updatedAt: "2026-05-28T16:20:00.000Z",
      route: "/bibliotheque",
    },
  ];
}

export function getDirigeantOrganisation(): DirigeantOrganisationSummary[] {
  return teamProfiles.map((team) => {
    const staff = getTeamStaff(team.id);
    const indicators = computeTeamIndicators(team, staff, getTeamObjectives(team.id), getTeamDocuments(team.id));

    return {
      teamId: team.id,
      teamName: team.name,
      category: team.category,
      level: team.level,
      mainGym: team.mainGym || "Salle à confirmer",
      trainingSlots: (team.trainingSlots || ["Créneau à confirmer"]).map(trainingSlotToText),
      headCoach: staff.find((member) => isHeadCoachRole(member.role) && member.isActive)?.name || "À affecter",
      assistantCoach: staff.find((member) => member.role === "assistant_coach" && member.isActive)?.name,
      parentReferent: staff.find((member) => member.role === "parent_referent" && member.isActive)?.name,
      dirigeantReferent: staff.find((member) => member.role === "dirigeant_referent" && member.isActive)?.name || "Référent à nommer",
      playersCount: indicators.playersCount,
      constraints: [team.championship || "Championnat à confirmer", ...(team.description ? [team.description] : [])],
      materialNeeds: team.id === "u13m1" ? ["Chasubles rouges", "Plots souples", "Ballons taille 6"] : ["Inventaire matériel à confirmer"],
      notes: indicators.alerts.length ? indicators.alerts.join(" ") : "Organisation stabilisée.",
    };
  });
}

export function getDirigeantQualityAlerts(): DirigeantQualityAlert[] {
  const planningAlerts = getDirigeantPlanningSummaries().flatMap((planning) =>
    planning.alerts.slice(0, 2).map((alert, index) => ({
      id: `alert-${planning.id}-${index}`,
      title: planning.teamName,
      targetId: planning.id,
      targetType: "planning" as const,
      severity: planning.qualityScore < 70 ? "haute" as const : "moyenne" as const,
      message: alert,
      recommendedAction: planning.qualityScore < 70 ? "Demander correction au staff technique." : "Suivre au prochain point commission.",
    }))
  );

  const documentAlerts = getDirigeantDocuments()
    .filter((document) => document.status === "to_correct")
    .map((document) => ({
      id: `alert-${document.id}`,
      title: document.title,
      targetId: document.id,
      targetType: "document" as const,
      severity: "haute" as const,
      message: "Document à corriger avant diffusion officielle.",
      recommendedAction: "Demander correction documentaire.",
    }));

  return [...planningAlerts, ...documentAlerts].slice(0, 8);
}
