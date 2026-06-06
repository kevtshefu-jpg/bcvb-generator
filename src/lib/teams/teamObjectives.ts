import type { TeamObjective, TeamObjectiveType } from "../../types/teams";

export const suggestedTeamObjectives: Array<{ title: string; type: TeamObjectiveType; bcvbLink: string }> = [
  { title: "Installer une défense Homme à Homme cohérente.", type: "defense_homme_a_homme", bcvbLink: "Défendre Fort" },
  { title: "Augmenter l’intensité collective.", type: "identite_bcvb", bcvbLink: "Intensité" },
  { title: "Améliorer la relance et le jeu rapide.", type: "style_de_jeu", bcvbLink: "Courir" },
  { title: "Mieux partager la balle.", type: "collectif", bcvbLink: "Partager la Balle" },
  { title: "Développer l’autonomie des joueurs.", type: "comportemental", bcvbLink: "Maîtrise" },
  { title: "Structurer les routines d’avant-match.", type: "priorite_cycle", bcvbLink: "Préparation match" },
  { title: "Améliorer l’assiduité.", type: "collectif", bcvbLink: "Engagement" },
  { title: "Stabiliser les comportements collectifs.", type: "comportemental", bcvbLink: "Vie de groupe" },
];

export function createSuggestedTeamObjective(teamId: string, season: string, index = 0): TeamObjective {
  const suggestion = suggestedTeamObjectives[index % suggestedTeamObjectives.length];
  return {
    id: `objective-${teamId}-${Date.now().toString(36)}`,
    teamId,
    season,
    type: suggestion.type,
    title: suggestion.title,
    description: `Objectif relié à l'identité BCVB : ${suggestion.bcvbLink}.`,
    observableCriteria: [`Le comportement attendu est visible en séance.`, `Le lien ${suggestion.bcvbLink} est explicité aux joueurs.`],
    quantifiableCriteria: ["1 indicateur suivi chaque cycle"],
    priority: "moyenne",
    status: "a_travailler",
  };
}
