import type { AnnualPlanning } from "../../types/planning";

export type PlanningScoreReport = {
  score: number;
  publishable: boolean;
  strengths: string[];
  warnings: string[];
  priorities: string[];
};

export function scorePlanning(planning: AnnualPlanning): PlanningScoreReport {
  const warnings: string[] = [];
  const strengths: string[] = [];
  const priorities: string[] = [];
  let score = 0;

  if (planning.title && planning.teamName) {
    score += 10;
    strengths.push("Plan identifié par équipe et saison.");
  } else {
    warnings.push("Titre ou équipe incomplet.");
  }

  if (planning.globalObjectives.length >= 2) {
    score += 15;
    strengths.push("Objectifs globaux présents.");
  } else {
    warnings.push("Ajouter au moins deux objectifs globaux.");
  }

  if (planning.cycles.length >= 5) {
    score += 15;
    strengths.push("Saison découpée en cycles lisibles.");
  } else {
    warnings.push("Découper la saison en davantage de cycles.");
  }

  const allWeeks = planning.cycles.flatMap((cycle) => cycle.weeks);
  const weeksWithObjectives = allWeeks.filter((week) => week.objectives.length > 0).length;
  const weeksWithCriteria = allWeeks.filter((week) => week.validationCriteria.length > 0).length;
  const linkedSessions = allWeeks.filter((week) => week.linkedSessionIds.length > 0).length;

  if (allWeeks.length >= 24) score += 10;
  else warnings.push("Prévoir au moins 24 semaines de progression.");

  if (weeksWithObjectives === allWeeks.length) {
    score += 15;
    strengths.push("Chaque semaine possède des objectifs.");
  } else {
    warnings.push("Certaines semaines n’ont pas encore d’objectif.");
  }

  if (weeksWithCriteria === allWeeks.length) {
    score += 15;
    strengths.push("Critères de validation présents sur chaque semaine.");
  } else {
    warnings.push("Certaines semaines manquent de critères de validation.");
  }

  if (planning.constraints.length > 0) score += 8;
  else warnings.push("Ajouter les contraintes réelles : gymnase, effectif, calendrier, indisponibilités.");

  if (planning.trainingFrequencyPerWeek > 0) score += 6;
  else warnings.push("La fréquence d’entraînement doit être renseignée.");

  if (["validée technique", "en validation dirigeant", "validé", "publié"].includes(planning.status)) score += 6;
  else priorities.push("Passer par une validation technique avant diffusion.");

  if (linkedSessions > 0) {
    score += 8;
    strengths.push("Des séances sont liées au plan.");
  } else {
    priorities.push("Lier progressivement des séances aux semaines clés.");
  }

  const lockedCycles = planning.cycles.filter((cycle) => cycle.locked || cycle.status === "verrouillé").length;
  if (lockedCycles > 0) strengths.push(`${lockedCycles} cycle(s) verrouillé(s) ou stabilisé(s).`);

  return {
    score: Math.min(100, score),
    publishable: score >= 78 && warnings.length <= 2,
    strengths,
    warnings,
    priorities,
  };
}
