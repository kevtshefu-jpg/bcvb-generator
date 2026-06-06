import type { QualityRecommendation, QualityWarning } from "../types/quality.types";

export function buildQualityRecommendations(warnings: QualityWarning[]): QualityRecommendation[] {
  const recommendations = new Map<string, QualityRecommendation>();

  function add(recommendation: QualityRecommendation) {
    const existing = recommendations.get(recommendation.id);
    if (!existing || existing.expectedGain < recommendation.expectedGain) {
      recommendations.set(recommendation.id, recommendation);
    }
  }

  for (const warning of warnings) {
    if (warning.category === "structure") {
      add({
        id: "restructure-document",
        priority: "critical",
        title: "Reconstruire la structure documentaire",
        description: "Ajouter titre, introduction, sections lisibles, conclusion et blocs BCVB typés.",
        expectedGain: 14,
        fixAction: "restructure",
      });
    }

    if (warning.category === "identity") {
      add({
        id: "restore-bcvb-identity",
        priority: "high",
        title: "Renforcer l’identité BCVB",
        description: "Réintroduire Défendre Fort, Courir, Partager la Balle, Homme à Homme et pédagogie club.",
        expectedGain: 10,
        fixAction: "add_bcvb_identity",
      });
    }

    if (warning.category === "table") {
      add({
        id: "normalize-tables",
        priority: warning.level === "critical" ? "critical" : "high",
        title: "Convertir les tableaux bruts",
        description: "Normaliser les colonnes, ajouter titre/légende et rendre le tableau imprimable.",
        expectedGain: 9,
        fixAction: "improve_tables",
      });
    }

    if (warning.category === "field") {
      add({
        id: "improve-field-use",
        priority: "high",
        title: "Rendre le document exploitable terrain",
        description: "Ajouter objectifs, organisation, consignes, critères observables et évolutions.",
        expectedGain: 12,
        fixAction: "improve_situations",
      });
    }

    if (warning.category === "export") {
      add({
        id: "prepare-print-export",
        priority: "medium",
        title: "Préparer l’export PDF",
        description: "Réduire les blocs trop longs, protéger tableaux/situations et éviter les débordements.",
        expectedGain: 7,
        fixAction: "improve_export_readiness",
      });
    }

    if (warning.category === "style") {
      add({
        id: "micro-style-correction",
        priority: "medium",
        title: "Améliorer le style éditorial",
        description: "Rendre le texte plus humain, sportif, précis et facile à lire.",
        expectedGain: 6,
        fixAction: "improve_style",
      });
    }
  }

  return Array.from(recommendations.values()).sort((a, b) => b.expectedGain - a.expectedGain);
}
