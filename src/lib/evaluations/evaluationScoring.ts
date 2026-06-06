import type {
  EvaluationCriterion,
  EvaluationDomain,
  EvaluationScore,
  PlayerEvaluation,
  PlayerEvaluationSummary,
} from "../../types/evaluations";
import { evaluationDomainLabels, evaluationDomains } from "./evaluationTemplates";

export function getEvaluationScoreLabel(score: EvaluationScore): string {
  return getScoreLabel(score);
}

export function getScoreLabel(score: EvaluationScore): string {
  const labels: Record<EvaluationScore, string> = {
    1: "Non acquis",
    2: "Fragile",
    3: "En cours",
    4: "Acquis",
    5: "Point fort",
  };

  return labels[score];
}

export function getEvaluationScoreTone(score: EvaluationScore): string {
  return getScoreTone(score);
}

export function getScoreTone(score: EvaluationScore): string {
  const tones: Record<EvaluationScore, string> = {
    1: "danger",
    2: "warning",
    3: "neutral",
    4: "success",
    5: "elite",
  };

  return tones[score];
}

export function computeDomainScores(
  evaluation: PlayerEvaluation,
  criteria: EvaluationCriterion[] = evaluation.criteria || []
): Record<EvaluationDomain, number> {
  return evaluationDomains.reduce<Record<EvaluationDomain, number>>((scores, domain) => {
    scores[domain] = computeDomainScore(evaluation, criteria, domain);
    return scores;
  }, {} as Record<EvaluationDomain, number>);
}

export function computeGlobalEvaluationScore(
  evaluation: PlayerEvaluation,
  criteria: EvaluationCriterion[] = evaluation.criteria || []
): number {
  const domainScores = computeDomainScores(evaluation, criteria);
  const scoredDomains = evaluationDomains.filter((domain) => domainScores[domain] > 0);
  return scoredDomains.length
    ? Math.round((scoredDomains.reduce((sum, domain) => sum + domainScores[domain], 0) / scoredDomains.length) * 10) / 10
    : 0;
}

export function identifyPriorityAxis(
  evaluation: PlayerEvaluation,
  criteria: EvaluationCriterion[] = evaluation.criteria || []
): EvaluationDomain[] {
  const domainScores = computeDomainScores(evaluation, criteria);
  return evaluationDomains.filter((domain) => domainScores[domain] > 0 && domainScores[domain] < 3);
}

export function identifyStrengths(
  evaluation: PlayerEvaluation,
  criteria: EvaluationCriterion[] = evaluation.criteria || []
): EvaluationDomain[] {
  const domainScores = computeDomainScores(evaluation, criteria);
  return evaluationDomains.filter((domain) => domainScores[domain] >= 4);
}

function scoreForCriterion(evaluation: PlayerEvaluation, criterionId: string) {
  return evaluation.scores.find((score) => score.criterionId === criterionId);
}

export function computeDomainScore(
  evaluation: PlayerEvaluation,
  criteria: EvaluationCriterion[],
  domain: EvaluationDomain
): number {
  const domainCriteria = criteria.filter((criterion) => criterion.domain === domain);
  const weighted = domainCriteria
    .map((criterion) => ({
      value: scoreForCriterion(evaluation, criterion.id)?.score,
      weight: criterion.weight || 1,
    }))
    .filter((item): item is { value: EvaluationScore; weight: number } => Boolean(item.value));

  if (weighted.length === 0) return 0;

  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  const total = weighted.reduce((sum, item) => sum + item.value * item.weight, 0);
  return Math.round((total / totalWeight) * 10) / 10;
}

export function computePlayerEvaluationSummary(
  evaluation: PlayerEvaluation,
  criteria: EvaluationCriterion[]
): PlayerEvaluationSummary {
  const domainScores = computeDomainScores(evaluation, criteria);
  const scoredDomains = evaluationDomains.filter((domain) => domainScores[domain] > 0);
  const globalScore = computeGlobalEvaluationScore(evaluation, criteria);
  const strongestDomains = identifyStrengths(evaluation, criteria);
  const priorityDomains = identifyPriorityAxis(evaluation, criteria);
  const consolidationDomains = scoredDomains.filter((domain) => domainScores[domain] >= 3 && domainScores[domain] < 4);
  const recommendation = priorityDomains.length
    ? `Prioriser ${priorityDomains.map((domain) => evaluationDomainLabels[domain]).join(", ")} sur le prochain cycle.`
    : strongestDomains.length
      ? `Valoriser les points forts : ${strongestDomains.map((domain) => evaluationDomainLabels[domain]).join(", ")}.`
      : consolidationDomains.length
        ? `Consolider ${consolidationDomains.map((domain) => evaluationDomainLabels[domain]).join(", ")} avec des situations ciblées.`
        : "Compléter la grille pour générer une recommandation.";

  return {
    playerId: evaluation.playerId,
    globalScore,
    domainScores,
    strongestDomains,
    priorityDomains,
    recommendation,
  };
}

export function suggestObjectiveFromSummary(summary: PlayerEvaluationSummary) {
  const domain = summary.priorityDomains[0] || summary.strongestDomains[0] || "agressivite_maitrisee";
  const label = evaluationDomainLabels[domain];

  return {
    domain,
    title: `Progresser sur ${label}`,
    targetDescription: `Améliorer le domaine ${label} sur les 4 prochaines semaines.`,
    observableCriterion: "Être capable de répéter le comportement attendu en opposition dirigée.",
    quantifiableCriterion: "Minimum 3 actions réussies observables par séquence.",
  };
}
