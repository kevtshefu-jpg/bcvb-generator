export type {
  EvaluationAudience,
  EvaluationCriterion,
  EvaluationDomain,
  EvaluationDomainKey,
  EvaluationObjective,
  EvaluationPeriod,
  EvaluationScore,
  EvaluationStats,
  EvaluationTemplate,
  IndividualObjective,
  PlayerEvaluation,
  PlayerEvaluationScore,
  PlayerEvaluationSummary,
  TeamEvaluationSummary,
} from "./evaluations";

export type LegacyEvaluationDomain =
  | "fondamentaux_offensifs"
  | "fondamentaux_defensifs"
  | "motricite_physique"
  | "comprehension_jeu"
  | "attitude"
  | "intensite"
  | "agressivite_maitrisee"
  | "maitrise"
  | "jeu_collectif"
  | "autonomie"
  | "respect_cadre";

export type LegacyPlayerEvaluation = {
  playerName: string;
  team: string;
  category: string;
  ratings: Record<LegacyEvaluationDomain, number>;
  strengths: string;
  priorityAxis: string;
  shortTermGoal: string;
  nextMonthChallenge: string;
};
