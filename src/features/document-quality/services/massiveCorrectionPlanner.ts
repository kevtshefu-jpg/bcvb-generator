import type { CorrectionAction, CorrectionPlan, QualityScore } from "../types/quality.types";

const fixActionMap: Record<string, CorrectionAction["type"]> = {
  restructure: "restructure",
  add_bcvb_identity: "add_bcvb_identity",
  improve_tables: "improve_tables",
  improve_situations: "improve_situations",
  improve_export_readiness: "improve_export_readiness",
  improve_style: "improve_style",
};

export function createCorrectionPlan(score: QualityScore, targetScore = 95): CorrectionPlan {
  const actions: CorrectionAction[] = score.recommendations.map((recommendation) => ({
    id: `action-${recommendation.id}`,
    type: fixActionMap[recommendation.fixAction] ?? "add_missing_sections",
    description: recommendation.description,
    expectedGain: recommendation.expectedGain,
    requiresAi: ["restructure", "add_bcvb_identity", "improve_situations", "improve_style"].includes(recommendation.fixAction),
  }));

  if (score.globalScore < 70 && !actions.some((action) => action.type === "restructure")) {
    actions.unshift({
      id: "action-rebuild-publication-club",
      type: "restructure",
      description: "Reconstruction publication club avec hiérarchie claire, blocs BCVB et sections actionnables.",
      expectedGain: 16,
      requiresAi: true,
    });
  }

  const estimatedGain = Math.min(
    targetScore - score.globalScore,
    actions.reduce((sum, action) => sum + action.expectedGain, 0)
  );

  return {
    targetScore,
    currentScore: score.globalScore,
    actions,
    estimatedGain: Math.max(0, estimatedGain),
    riskLevel: actions.some((action) => action.type === "restructure") ? "medium" : "low",
  };
}
