import type {
  EvaluationCriterion,
  EvaluationDomain,
  EvaluationPeriod,
  EvaluationPlayer,
  EvaluationTeam,
  EvaluationsDashboardData,
  PlayerEvaluation,
  TeamEvaluationSummary,
} from "../../types/evaluations";
import { computePlayerEvaluationSummary } from "./evaluationScoring";
import { evaluationDomainLabels, evaluationDomains, getEvaluationTemplateByCategory } from "./evaluationTemplates";

function average(values: number[]) {
  const filtered = values.filter((value) => Number.isFinite(value) && value > 0);
  if (filtered.length === 0) return 0;
  return Math.round((filtered.reduce((sum, value) => sum + value, 0) / filtered.length) * 10) / 10;
}

export function computeTeamEvaluationSummary(
  evaluations: PlayerEvaluation[],
  criteria: EvaluationCriterion[],
  team: EvaluationTeam,
  period: EvaluationPeriod,
  season: string
): TeamEvaluationSummary {
  const teamEvaluations = evaluations.filter((evaluation) =>
    evaluation.teamId === team.id && evaluation.period === period && evaluation.season === season
  );
  const playerSummaries = teamEvaluations.map((evaluation) => computePlayerEvaluationSummary(evaluation, criteria));
  const domainAverages = evaluationDomains.reduce<Record<EvaluationDomain, number>>((acc, domain) => {
    acc[domain] = average(playerSummaries.map((summary) => summary.domainScores[domain]));
    return acc;
  }, {} as Record<EvaluationDomain, number>);
  const teamGlobalScore = average(playerSummaries.map((summary) => summary.globalScore));
  const teamStrengths = evaluationDomains
    .filter((domain) => domainAverages[domain] >= 4)
    .map((domain) => evaluationDomainLabels[domain]);
  const teamPriorities = evaluationDomains
    .filter((domain) => domainAverages[domain] > 0 && domainAverages[domain] < 3)
    .map((domain) => evaluationDomainLabels[domain]);
  const playersToSupport = playerSummaries
    .filter((summary) => summary.globalScore > 0 && summary.globalScore < 3)
    .map((summary) => summary.playerId);
  const planningRecommendations = buildPlanningRecommendations(domainAverages);

  return {
    teamId: team.id,
    period,
    season,
    playersCount: teamEvaluations.length,
    teamGlobalScore,
    domainAverages,
    teamStrengths,
    teamPriorities,
    playersToSupport,
    planningRecommendations,
  };
}

export function buildPlanningRecommendations(domainAverages: Record<EvaluationDomain, number>) {
  const recommendations: string[] = [];

  if (domainAverages.fondamentaux_defensifs > 0 && domainAverages.fondamentaux_defensifs < 3) {
    recommendations.push("Prévoir un cycle de 4 semaines sur défense H-H, pression porteur, aide/reprise et repli.");
  }

  if (domainAverages.jeu > 0 && domainAverages.jeu < 3) {
    recommendations.push("Prévoir des situations de surnombre, lecture de l’aide et contraintes de passe.");
  }

  if (domainAverages.intensite > 0 && domainAverages.intensite < 3) {
    recommendations.push("Augmenter les séquences courtes, défis chronométrés et transitions.");
  }

  if (domainAverages.fondamentaux_offensifs > 0 && domainAverages.fondamentaux_offensifs < 3) {
    recommendations.push("Renforcer passe-dribble-tir en rythme, avec critères de réussite simples.");
  }

  return recommendations.length ? recommendations : ["Conserver le cycle actuel et individualiser les priorités joueurs."];
}

export function buildEvaluationsDashboardData(
  evaluations: PlayerEvaluation[],
  players: EvaluationPlayer[],
  teams: EvaluationTeam[],
  criteria: EvaluationCriterion[],
  period: EvaluationPeriod,
  season: string
): EvaluationsDashboardData {
  const periodEvaluations = evaluations.filter((evaluation) => evaluation.period === period && evaluation.season === season);
  const evaluatedPlayerIds = new Set(periodEvaluations.map((evaluation) => evaluation.playerId));
  const completedEvaluations = periodEvaluations.length;
  const missingEvaluations = players.filter((player) => !evaluatedPlayerIds.has(player.id)).length;
  const summaries = periodEvaluations.map((evaluation) => computePlayerEvaluationSummary(evaluation, criteria));
  const strongDomainsByTeam = teams.flatMap((team) => {
    const summary = computeTeamEvaluationSummary(periodEvaluations, criteria, team, period, season);
    return evaluationDomains
      .filter((domain) => summary.domainAverages[domain] >= 4)
      .map((domain) => ({ teamId: team.id, domain, score: summary.domainAverages[domain] }));
  });
  const weakDomainsByCategory = Array.from(new Set(players.map((player) => player.category))).flatMap((category) => {
    const categoryPlayerIds = new Set(players.filter((player) => player.category === category).map((player) => player.id));
    const categorySummaries = summaries.filter((summary) => categoryPlayerIds.has(summary.playerId));
    return evaluationDomains
      .map((domain) => ({ category, domain, score: average(categorySummaries.map((summary) => summary.domainScores[domain])) }))
      .filter((item) => item.score > 0 && item.score < 3);
  });

  return {
    evaluatedPlayersRate: players.length ? Math.round((completedEvaluations / players.length) * 100) : 0,
    completedEvaluations,
    missingEvaluations,
    teamAverageScores: teams.map((team) => {
      const summary = computeTeamEvaluationSummary(periodEvaluations, criteria, team, period, season);
      return { teamId: team.id, score: summary.teamGlobalScore };
    }),
    priorityDomainsByTeam: teams.map((team) => {
      const summary = computeTeamEvaluationSummary(periodEvaluations, criteria, team, period, season);
      return {
        teamId: team.id,
        domains: evaluationDomains.filter((domain) => summary.domainAverages[domain] > 0 && summary.domainAverages[domain] < 3),
      };
    }),
    activeIndividualObjectives: periodEvaluations.filter((evaluation) => evaluation.individualObjective?.status === "a_travailler" || evaluation.individualObjective?.status === "en_cours").length,
    playersInStrongProgression: periodEvaluations
      .filter((evaluation) => computePlayerEvaluationSummary(evaluation, criteria).globalScore >= 4)
      .map((evaluation) => evaluation.playerId),
    strongDomainsByTeam,
    weakDomainsByCategory,
    openIndividualObjectives: periodEvaluations.filter((evaluation) => evaluation.individualObjective?.status === "a_travailler" || evaluation.individualObjective?.status === "en_cours").length,
    playersWithoutRecentReport: players.filter((player) => !evaluatedPlayerIds.has(player.id)).map((player) => player.id),
  };
}

export function buildTeamEvaluationSummary(
  evaluations: PlayerEvaluation[],
  players: EvaluationPlayer[],
  teamId: string
) {
  const teamPlayers = players.filter((player) => player.teamId === teamId);
  const referencePlayer = teamPlayers[0];
  const team: EvaluationTeam = {
    id: teamId,
    name: referencePlayer?.teamName || "Équipe BCVB",
    category: referencePlayer?.category || "U13",
    level: "BCVB",
  };
  const latestEvaluation = evaluations.find((evaluation) => evaluation.teamId === teamId);
  const period = latestEvaluation?.period || "mensuel";
  const season = latestEvaluation?.season || "2026-2027";
  const criteria = getEvaluationTemplateByCategory(team.category, team.level);
  return computeTeamEvaluationSummary(evaluations, criteria, team, period, season);
}

export function buildEvaluationDashboardData(
  evaluations: PlayerEvaluation[],
  players: EvaluationPlayer[],
  teams: EvaluationTeam[]
): EvaluationsDashboardData {
  const referenceTeam = teams[0];
  const criteria = getEvaluationTemplateByCategory(referenceTeam?.category || "U13", referenceTeam?.level);
  return buildEvaluationsDashboardData(evaluations, players, teams, criteria, "mensuel", "2026-2027");
}
