import type { DocumentFamily, QualityScore, QualityWarning } from "../types/quality.types";
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

function scoreTables(content: string, warnings: QualityWarning[]) {
  const tables = parseMarkdownTables(content);
  if (tables.length === 0) {
    warnings.push(warning("tables-missing", "info", "table", "Aucun tableau éditorial détecté."));
    return 58;
  }

  const wideTables = tables.filter((table) => table.headers.length > 6);
  const irregularTables = tables.filter((table) => table.warnings.length > 0);
  if (wideTables.length > 0) warnings.push(warning("table-too-wide", "warning", "table", "Tableau trop large pour A4 portrait."));
  if (irregularTables.length > 0) warnings.push(warning("table-irregular", "warning", "table", "Tableau brut ou colonnes irrégulières."));

  return clampScore(90 - wideTables.length * 12 - irregularTables.length * 8);
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

  const structureScore = scoreStructure(content, warnings);
  const bcvbIdentityScore = scoreIdentity(normalized, warnings);
  const pedagogicalScore = scorePedagogy(normalized, warnings);
  const fieldUseScore = scoreFieldUse(normalized, family, warnings);
  const tableScore = scoreTables(content, warnings);
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
    createdAt: new Date().toISOString(),
  };
}
