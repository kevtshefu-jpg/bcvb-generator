import type { CorrectionAction, CorrectionMode, CorrectionPlan, QualityScore } from "../types/quality.types";

const fixActionMap: Record<string, CorrectionAction["type"]> = {
  restructure: "restructure",
  add_bcvb_identity: "add_bcvb_identity",
  improve_tables: "improve_tables",
  improve_situations: "improve_situations",
  improve_export_readiness: "improve_export_readiness",
  improve_style: "improve_style",
};

const modeDefaults: Record<CorrectionMode, { targetScore: number; riskLevel: CorrectionPlan["riskLevel"] }> = {
  micro_correction: { targetScore: 80, riskLevel: "low" },
  strong_improvement: { targetScore: 90, riskLevel: "medium" },
  publication_rebuild: { targetScore: 95, riskLevel: "high" },
};

const modeLabels: Record<CorrectionMode, string> = {
  micro_correction: "Micro-correction",
  strong_improvement: "Amélioration forte",
  publication_rebuild: "Reconstruction publication club",
};

function baseActions(score: QualityScore): CorrectionAction[] {
  return score.recommendations.map((recommendation) => ({
    id: `action-${recommendation.id}`,
    type: fixActionMap[recommendation.fixAction] ?? "add_missing_sections",
    description: recommendation.description,
    expectedGain: recommendation.expectedGain,
    requiresAi: ["restructure", "add_bcvb_identity", "improve_situations", "improve_style"].includes(recommendation.fixAction),
  }));
}

function ensureAction(actions: CorrectionAction[], action: CorrectionAction) {
  if (!actions.some((item) => item.type === action.type)) {
    actions.unshift(action);
  }
}

export function createCorrectionPlan(
  score: QualityScore,
  targetScore?: number,
  mode: CorrectionMode = "strong_improvement"
): CorrectionPlan {
  const resolvedTargetScore = targetScore ?? modeDefaults[mode].targetScore;
  let actions = baseActions(score);

  if (mode === "micro_correction") {
    actions = actions.filter((action) => action.type === "improve_style" || action.type === "improve_export_readiness");
    ensureAction(actions, {
      id: "action-micro-style",
      type: "improve_style",
      description: "Orthographe, lisibilité, petits titres, retours ligne et respiration éditoriale.",
      expectedGain: 5,
      requiresAi: false,
    });
  }

  if (mode === "strong_improvement") {
    ensureAction(actions, {
      id: "action-strong-missing-sections",
      type: "add_missing_sections",
      description: "Ajout des sections manquantes, critères de réussite, objectifs et blocs de vigilance.",
      expectedGain: 10,
      requiresAi: false,
    });
  }

  if (mode === "publication_rebuild" || score.globalScore < 70) {
    ensureAction(actions, {
      id: "action-rebuild-publication-club",
      type: "restructure",
      description: "Reconstruction publication club avec hiérarchie claire, blocs BCVB et sections actionnables.",
      expectedGain: 16,
      requiresAi: true,
    });
  }

  if (mode === "publication_rebuild") {
    ensureAction(actions, {
      id: "action-rebuild-identity",
      type: "add_bcvb_identity",
      description: "Réintégration explicite de la philosophie BCVB et des repères pédagogiques club.",
      expectedGain: 9,
      requiresAi: true,
    });
  }

  const estimatedGain = Math.min(
    resolvedTargetScore - score.globalScore,
    actions.reduce((sum, action) => sum + action.expectedGain, 0)
  );

  return {
    mode,
    targetScore: resolvedTargetScore,
    currentScore: score.globalScore,
    actions,
    estimatedGain: Math.max(0, estimatedGain),
    riskLevel: modeDefaults[mode].riskLevel,
    preservedItems: [
      "Source initiale non modifiée",
      "Informations factuelles conservées",
      "Incertitudes maintenues visibles",
      "Ancien score et version précédente gardés",
    ],
    restructuredItems:
      mode === "micro_correction"
        ? ["Espacements", "Petits titres", "Lisibilité", "Retours ligne"]
        : mode === "strong_improvement"
          ? ["Sections manquantes", "Tableaux", "Critères de réussite", "Blocs BCVB", "Style éditorial"]
          : ["Plan complet", "Hiérarchie documentaire", "Tableaux", "Situations", "Identité BCVB", "Checklist publication"],
    risks:
      mode === "micro_correction"
        ? ["Gain limité si la structure source est faible."]
        : mode === "strong_improvement"
          ? ["Certains passages devront être relus pour valider la formulation finale."]
          : ["Relecture humaine obligatoire avant validation, car la structure est profondément réorganisée."],
  };
}

export function getCorrectionModeLabel(mode: CorrectionMode) {
  return modeLabels[mode];
}
