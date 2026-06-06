import type { TeamLinkedDocument, TeamObjective, TeamProfile } from "../../types/teams";

export function buildPlanningPrefillFromTeam(team: TeamProfile, objectives: TeamObjective[]) {
  return {
    teamName: team.name,
    category: team.category,
    level: team.level,
    season: team.season,
    constraints: team.trainingSlots || [],
    priorities: objectives
      .filter((objective) => objective.priority === "haute" || objective.status === "en_cours")
      .map((objective) => objective.title),
    period: "debut_saison",
  };
}

export function buildSessionPrefillFromTeam(team: TeamProfile, objectives: TeamObjective[]) {
  const priorityObjective = objectives.find((objective) => objective.status === "en_cours") || objectives[0];
  return {
    team: team.name,
    category: team.category,
    level: team.level,
    objective: priorityObjective?.title || "Défendre Fort, Courir et Partager la Balle",
    bcvbValues: ["Défendre Fort", "Courir", "Partager la Balle"],
  };
}

export function filterTeamDocuments(documents: TeamLinkedDocument[], type: TeamLinkedDocument["documentType"] | "all") {
  return type === "all" ? documents : documents.filter((document) => document.documentType === type);
}

export function createCollectiveObjectiveFromEvaluation(teamId: string, season: string, weakDomain = "défense") {
  return {
    id: `objective-${teamId}-${Date.now()}`,
    teamId,
    season,
    type: weakDomain.includes("déf") ? "defensif" as const : "collectif" as const,
    title: weakDomain.includes("déf")
      ? "Renforcer défense H-H et pression porteur"
      : `Renforcer ${weakDomain}`,
    description: "Objectif collectif généré depuis les tendances d’évaluations joueurs.",
    observableCriteria: "Comportement observable en opposition et en match.",
    quantifiableCriteria: "Au moins 3 séquences validées par séance.",
    priority: "haute" as const,
    status: "a_faire" as const,
  };
}

