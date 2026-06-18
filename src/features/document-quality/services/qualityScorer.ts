import type { DocumentFamily, QualityEvidence, QualityScore, QualityWarning } from "../types/quality.types";
import { parseMarkdownTables } from "../../rich-markdown/services/tableParser";
import { buildQualityRecommendations } from "./qualityRecommendations";
import { getPublicationStatus, qualityWeights, type QualityWeightKey } from "./qualityRules";

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function hasAny(content: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(content));
}

function count(content: string, pattern: RegExp) {
  return content.match(pattern)?.length ?? 0;
}

function warning(
  id: string,
  level: QualityWarning["level"],
  category: string,
  message: string,
  fixable = true
): QualityWarning {
  return { id, level, category, message, fixable };
}

type FamilyRequirement = {
  id: string;
  label: string;
  patterns: RegExp[];
  warningCategory: string;
  warningMessage: string;
};

const familyRequirements: Record<DocumentFamily, FamilyRequirement[]> = {
  guide_coach: [
    {
      id: "guide-category",
      label: "Catégorie ou public coach identifié",
      patterns: [/u7|u9|u11|u13|u15|u18|senior|coach|entraineur/],
      warningCategory: "field",
      warningMessage: "La catégorie ou le public coach n’est pas assez identifiable.",
    },
    {
      id: "guide-coach-role",
      label: "Rôle du coach clarifié",
      patterns: [/role du coach|posture coach|intervention|feedback|consigne/],
      warningCategory: "pedagogy",
      warningMessage: "Le rôle du coach doit être plus explicite.",
    },
    {
      id: "guide-planning",
      label: "Repères de planification",
      patterns: [/planification|cycle|semaine|saison|progression/],
      warningCategory: "pedagogy",
      warningMessage: "Les repères de planification sont insuffisants.",
    },
    {
      id: "guide-evaluation",
      label: "Outils d’évaluation ou critères observables",
      patterns: [/evaluation|critere|observable|indicateur|bilan/],
      warningCategory: "field",
      warningMessage: "Le guide doit mieux préciser les critères d’observation.",
    },
  ],
  cahier_technique: [
    {
      id: "technical-theme",
      label: "Thème technique clairement posé",
      patterns: [/technique|tir|passe|dribble|appuis|defense|attaque|transition|repli/],
      warningCategory: "structure",
      warningMessage: "Le thème technique central doit être clarifié.",
    },
    {
      id: "technical-situations",
      label: "Situations de travail en nombre suffisant",
      patterns: [/situation|atelier|exercice|jeu reduit|opposition/],
      warningCategory: "field",
      warningMessage: "Le cahier technique doit contenir davantage de situations exploitables.",
    },
    {
      id: "technical-progressions",
      label: "Progressions et variables",
      patterns: [/evolution|variable|simplification|complexification|regulation/],
      warningCategory: "pedagogy",
      warningMessage: "Les variables pédagogiques sont trop faibles.",
    },
  ],
  fiche_seance: [
    {
      id: "session-objectives",
      label: "Objectifs de séance",
      patterns: [/objectif|intention|theme/],
      warningCategory: "field",
      warningMessage: "Une fiche séance doit afficher un objectif clair.",
    },
    {
      id: "session-duration",
      label: "Durée ou temps de travail",
      patterns: [/duree|temps|minutes|min\b|chrono/],
      warningCategory: "field",
      warningMessage: "La durée de séance ou des situations est manquante.",
    },
    {
      id: "session-organization",
      label: "Organisation matérielle et joueurs",
      patterns: [/organisation|materiel|joueurs|terrain|demi-terrain|plots/],
      warningCategory: "field",
      warningMessage: "L’organisation terrain doit être précisée.",
    },
    {
      id: "session-instructions",
      label: "Consignes joueurs",
      patterns: [/consigne|regle|depart|rotation|contrainte/],
      warningCategory: "field",
      warningMessage: "Les consignes joueurs sont insuffisantes.",
    },
    {
      id: "session-success",
      label: "Critères de réussite",
      patterns: [/critere|reussite|observable|indicateur|score cible/],
      warningCategory: "field",
      warningMessage: "Les critères de réussite doivent être formulés.",
    },
  ],
  situation_pedagogique: [
    {
      id: "situation-objective",
      label: "Objectif de situation",
      patterns: [/objectif|intention/],
      warningCategory: "field",
      warningMessage: "La situation doit avoir un objectif lisible.",
    },
    {
      id: "situation-organization",
      label: "Organisation",
      patterns: [/organisation|terrain|joueurs|materiel/],
      warningCategory: "field",
      warningMessage: "L’organisation de la situation est trop légère.",
    },
    {
      id: "situation-regulation",
      label: "Évolutions et régulations",
      patterns: [/evolution|variable|regulation|simplifier|complexifier/],
      warningCategory: "pedagogy",
      warningMessage: "Les évolutions ou régulations sont manquantes.",
    },
  ],
  outil_evaluation: [
    {
      id: "evaluation-criteria",
      label: "Critères d’évaluation",
      patterns: [/critere|observable|niveau|indicateur|maitrise/],
      warningCategory: "table",
      warningMessage: "L’outil d’évaluation doit préciser les critères et niveaux.",
    },
    {
      id: "evaluation-scale",
      label: "Échelle ou niveaux",
      patterns: [/niveau|score|note|1|2|3|4|5|acquis|en cours/],
      warningCategory: "table",
      warningMessage: "L’échelle d’évaluation n’est pas assez claire.",
    },
  ],
  document_familles: [
    {
      id: "families-audience",
      label: "Message compréhensible familles",
      patterns: [/parents|famille|familles|responsable|communication/],
      warningCategory: "style",
      warningMessage: "Le public familles n’est pas assez explicite.",
    },
    {
      id: "families-action",
      label: "Action attendue",
      patterns: [/a faire|merci de|rendez-vous|inscription|reponse|organisation/],
      warningCategory: "structure",
      warningMessage: "L’action attendue par les familles doit être plus claire.",
    },
  ],
  document_administratif: [
    {
      id: "admin-purpose",
      label: "Objet administratif",
      patterns: [/objet|decision|proces-verbal|compte rendu|reglement|administratif/],
      warningCategory: "structure",
      warningMessage: "L’objet administratif du document doit être clarifié.",
    },
    {
      id: "admin-validation",
      label: "Validation ou suivi",
      patterns: [/validation|signature|date|responsable|decision|suivi/],
      warningCategory: "structure",
      warningMessage: "Les éléments de validation ou de suivi sont insuffisants.",
    },
  ],
  compte_rendu: [
    {
      id: "report-date",
      label: "Date ou contexte de réunion",
      patterns: [/date|reunion|commission|bilan|saison/],
      warningCategory: "structure",
      warningMessage: "Le contexte du compte rendu doit être précisé.",
    },
    {
      id: "report-decisions",
      label: "Décisions et actions",
      patterns: [/decision|action|a faire|responsable|echeance/],
      warningCategory: "structure",
      warningMessage: "Les décisions ou actions à suivre sont trop peu visibles.",
    },
  ],
  unknown: [
    {
      id: "generic-purpose",
      label: "Objectif du document",
      patterns: [/objectif|intention|pourquoi|usage|but/],
      warningCategory: "structure",
      warningMessage: "L’objectif du document doit être précisé.",
    },
    {
      id: "generic-audience",
      label: "Public cible",
      patterns: [/coach|joueur|parents|familles|dirigeant|benevole|club/],
      warningCategory: "field",
      warningMessage: "Le public cible du document doit être identifiable.",
    },
  ],
};

function buildFamilyEvidence(normalized: string, family: DocumentFamily, warnings: QualityWarning[]): QualityEvidence[] {
  return familyRequirements[family].map((requirement) => {
    const passed = hasAny(normalized, requirement.patterns);

    if (!passed) {
      warnings.push(
        warning(
          `missing-${requirement.id}`,
          "warning",
          requirement.warningCategory,
          requirement.warningMessage
        )
      );
    }

    return {
      id: requirement.id,
      label: requirement.label,
      passed,
      detail: passed ? "Présent dans la source." : requirement.warningMessage,
    };
  });
}

function scoreStructure(content: string, warnings: QualityWarning[]) {
  let score = 0;
  if (/^#\s+.+/m.test(content) || /title\s*:/i.test(content)) score += 20;
  if (/intro|introduction|contexte|intention/i.test(content)) score += 15;
  if ((content.match(/^##\s+/gm) ?? []).length >= 3) score += 25;
  if (/:::bcvb-[a-z0-9_-]+/i.test(content)) score += 25;
  if (/conclusion|bilan|synth[eè]se|checklist/i.test(content)) score += 15;

  if (score < 55) warnings.push(warning("structure-weak", "critical", "structure", "Structure documentaire trop faible."));
  return clampScore(score);
}

function scoreIdentity(normalized: string, warnings: QualityWarning[]) {
  const signals = [
    /defendre fort/,
    /courir/,
    /partager la balle/,
    /homme a homme/,
    /intensite|agressivite|maitrise|jeu/,
    /je decouvre|je m'exerce|je retranscris|je regule/,
  ];
  const detected = signals.filter((pattern) => pattern.test(normalized)).length;
  const score = clampScore((detected / signals.length) * 100);
  if (score < 50) warnings.push(warning("identity-weak", "warning", "identity", "Identité BCVB insuffisamment visible."));
  return score;
}

function scorePedagogy(normalized: string, warnings: QualityWarning[]) {
  const detected = [
    /objectif/,
    /progression|cycle|planification/,
    /situation|exercice|atelier/,
    /critere|observable|evaluation/,
    /evolution|variable|regulation/,
  ].filter((pattern) => pattern.test(normalized)).length;
  const score = clampScore((detected / 5) * 100);
  if (score < 55) warnings.push(warning("pedagogy-weak", "warning", "field", "Pédagogie terrain à renforcer."));
  return score;
}

function scoreFieldUse(normalized: string, family: DocumentFamily, warnings: QualityWarning[]) {
  const required =
    family === "fiche_seance" || family === "situation_pedagogique"
      ? [/duree|temps/, /organisation/, /consigne/, /critere/, /evolution|variable/, /bilan|retour/]
      : [/coach/, /joueur/, /terrain|gymnase|match/, /observable|quantifiable/];
  const detected = required.filter((pattern) => pattern.test(normalized)).length;
  const score = clampScore((detected / required.length) * 100);
  if (score < 60) warnings.push(warning("field-use-weak", "warning", "field", "Exploitabilité terrain incomplète."));
  return score;
}

function scoreTables(content: string, family: DocumentFamily, warnings: QualityWarning[]) {
  const tables = parseMarkdownTables(content);
  const tableExpected = family === "outil_evaluation" || family === "document_administratif" || family === "compte_rendu";

  if (tables.length === 0) {
    warnings.push(
      warning(
        "tables-missing",
        tableExpected ? "warning" : "info",
        "table",
        tableExpected
          ? "Un tableau structuré est attendu pour cette famille documentaire."
          : "Aucun tableau éditorial détecté."
      )
    );
    return tableExpected ? 42 : 62;
  }

  const wideTables = tables.filter((table) => table.headers.length > 6);
  const irregularTables = tables.filter((table) => table.warnings.length > 0);
  const emptyCells = tables.filter((table) => table.rows.some((row) => row.some((cell) => cell.trim().length === 0)));
  if (wideTables.length > 0) warnings.push(warning("table-too-wide", "warning", "table", "Tableau trop large pour A4 portrait."));
  if (irregularTables.length > 0) warnings.push(warning("table-irregular", "warning", "table", "Tableau brut ou colonnes irrégulières."));
  if (emptyCells.length > 0) warnings.push(warning("table-empty-cells", "info", "table", "Cellules vides détectées : vérifier la lisibilité."));

  return clampScore(92 - wideTables.length * 12 - irregularTables.length * 8 - emptyCells.length * 3);
}

function scoreSituations(content: string, family: DocumentFamily, warnings: QualityWarning[]) {
  const situationCount = count(content, /situation|exercice|atelier|:::bcvb-situation/gi);
  const expected = family === "cahier_technique" || family === "guide_coach" ? 6 : family === "fiche_seance" ? 2 : 1;
  const score = clampScore((situationCount / expected) * 100);
  if (score < 55) warnings.push(warning("situations-missing", "warning", "field", "Situations pédagogiques insuffisantes."));
  return score;
}

function scoreDiagrams(content: string, family: DocumentFamily, warnings: QualityWarning[]) {
  const diagramCount = count(content, /terrain|sch[ée]ma|court|players|arrows|ball|:::bcvb-diagram/gi);
  const expected = family === "cahier_technique" || family === "fiche_seance" ? 2 : 1;
  const score = clampScore((diagramCount / expected) * 100);
  if (score < 50 && (family === "fiche_seance" || family === "cahier_technique")) {
    warnings.push(warning("diagrams-missing", "warning", "field", "Schémas terrain à ajouter ou vérifier."));
  }
  return score;
}

function scoreStyle(content: string, warnings: QualityWarning[]) {
  const paragraphs = content.split(/\n{2,}/).filter((paragraph) => paragraph.trim().length > 0);
  const longBlocks = paragraphs.filter((paragraph) => paragraph.length > 900).length;
  const parasiteCount = count(content, /\bundefined\b|\[object Object\]|�/g);
  const score = clampScore(92 - longBlocks * 10 - parasiteCount * 12);
  if (longBlocks > 0) warnings.push(warning("blocks-too-long", "warning", "style", "Certains blocs sont trop longs pour une lecture premium."));
  if (parasiteCount > 0) warnings.push(warning("parasites", "critical", "style", "Artefacts techniques visibles dans le document."));
  return score;
}

function scoreExportReadiness(content: string, warnings: QualityWarning[]) {
  const tooWideLines = content.split("\n").filter((line) => line.length > 150).length;
  const rawButtons = count(content, /<button|class=.*button|onClick=/gi);
  const rawTables = parseMarkdownTables(content).filter((table) => table.headers.length > 7).length;
  const score = clampScore(94 - tooWideLines * 3 - rawButtons * 15 - rawTables * 10);

  if (tooWideLines > 4) warnings.push(warning("export-lines-too-wide", "warning", "export", "Risque de débordement PDF."));
  if (rawButtons > 0) warnings.push(warning("ui-in-document", "critical", "export", "Éléments UI détectés dans le contenu exportable."));
  return score;
}

export function scoreDocument(input: {
  contentSource: string;
  renderedContent?: string;
  family: DocumentFamily;
}): QualityScore {
  const content = input.renderedContent || input.contentSource || "";
  const normalized = normalize(content);
  const warnings: QualityWarning[] = [];
  const family = input.family || "unknown";

  if (content.trim().length < 350) {
    warnings.push(warning("content-too-short", "critical", "structure", "Document trop court pour être publiable."));
  }

  const evidence = buildFamilyEvidence(normalized, family, warnings);

  const structureScore = scoreStructure(content, warnings);
  const bcvbIdentityScore = scoreIdentity(normalized, warnings);
  const pedagogicalScore = scorePedagogy(normalized, warnings);
  const fieldUseScore = scoreFieldUse(normalized, family, warnings);
  const tableScore = scoreTables(content, family, warnings);
  const situationScore = scoreSituations(content, family, warnings);
  const diagramScore = scoreDiagrams(content, family, warnings);
  const styleScore = scoreStyle(content, warnings);
  const exportReadinessScore = scoreExportReadiness(content, warnings);

  if (!hasAny(normalized, [/titre|title|^# /m])) {
    warnings.push(warning("title-missing", "critical", "structure", "Titre principal manquant."));
  }

  const subscores: Record<QualityWeightKey, number> = {
    structureScore,
    bcvbIdentityScore,
    pedagogicalScore,
    fieldUseScore,
    tableScore,
    situationScore,
    diagramScore,
    styleScore,
    exportReadinessScore,
  };
  const weights = qualityWeights[family] ?? qualityWeights.unknown;
  const globalScore = clampScore(
    (Object.entries(subscores) as Array<[QualityWeightKey, number]>).reduce(
      (sum, [key, value]) => sum + value * weights[key],
      0
    ) / 100
  );
  const criticalWarnings = warnings.filter((item) => item.level === "critical").length;
  const recommendations = buildQualityRecommendations(warnings);

  return {
    globalScore,
    status: getPublicationStatus(globalScore, criticalWarnings),
    family,
    structureScore,
    bcvbIdentityScore,
    pedagogicalScore,
    fieldUseScore,
    tableScore,
    situationScore,
    diagramScore,
    styleScore,
    exportReadinessScore,
    warnings,
    recommendations,
    evidence,
    createdAt: new Date().toISOString(),
  };
}
