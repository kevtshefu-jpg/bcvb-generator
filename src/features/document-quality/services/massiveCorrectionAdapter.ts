import type { CorrectionPlan, DocumentFamily, MassiveCorrectionResult } from "../types/quality.types";
import { scoreDocument } from "./qualityScorer";

function ensureSection(content: string, title: string, body: string) {
  if (new RegExp(`^##\\s+${title}`, "im").test(content)) return content;
  return `${content.trim()}\n\n## ${title}\n${body}`.trim();
}

function normalizeTables(content: string) {
  return content.replace(/\n([^\n|]+\s{2,}[^\n]+\n(?:[^\n|]+\s{2,}[^\n]+\n?)+)/g, (match) => {
    const rows = match
      .trim()
      .split("\n")
      .map((line) => line.trim().split(/\s{2,}/).map((cell) => cell.trim()));
    const columnCount = Math.max(...rows.map((row) => row.length));
    const normalizedRows = rows.map((row) => Array.from({ length: columnCount }, (_, index) => row[index] || ""));
    const header = normalizedRows[0];
    const separator = header.map(() => "---");
    return `\n${[header, separator, ...normalizedRows.slice(1)].map((row) => `| ${row.join(" | ")} |`).join("\n")}\n`;
  });
}

function addBcvbIdentity(content: string) {
  if (/Défendre Fort|Defendre Fort|Partager la Balle/i.test(content)) return content;

  return `
:::bcvb-identity
title: Identité BCVB
content: Défendre Fort, Courir et Partager la Balle. Défense Homme à Homme, intensité, agressivité maîtrisée, jeu collectif et progression en quatre temps : je découvre, je m’exerce, je retranscris en match, je régule.
:::

${content}`.trim();
}

function addExportNotes(content: string) {
  return ensureSection(
    content,
    "Checklist publication",
    [
      "- Source conservée et versionnée.",
      "- Tableaux relus en affichage écran et impression.",
      "- Situations, schémas et critères validés humainement.",
      "- Export PDF contrôlé sans boutons ni éléments d’interface.",
    ].join("\n")
  );
}

function addSituationTemplate(content: string) {
  if (/:::bcvb-situation|##\s+Situation/i.test(content)) return content;

  return ensureSection(
    content,
    "Situation pédagogique à compléter",
    `
:::bcvb-situation
title: Situation à valider
objectif: À reprendre depuis la source, sans inventer.
organisation: À compléter par l’admin ou le coach.
consignes_joueurs: À préciser après relecture.
criteres_reussite: Critères observables à formuler.
evolution_1: Simplification ou complexification à définir.
:::
`.trim()
  );
}

export function buildMassiveCorrectionPrompt(input: {
  contentSource: string;
  family: DocumentFamily;
  correctionPlan: CorrectionPlan;
}) {
  return `
Tu es éditeur documentaire BCVB.
Mission : reconstruction publication club guidée par un score qualité.
Contraintes :
- conserver toutes les informations source ;
- ne jamais inventer d’information absente ;
- structurer en BCVB Rich Markdown ;
- corriger tableaux, sections, style, situations et export readiness ;
- signaler les incertitudes.

Famille : ${input.family}
Score actuel : ${input.correctionPlan.currentScore}
Objectif : ${input.correctionPlan.targetScore}
Actions :
${input.correctionPlan.actions.map((action) => `- ${action.type}: ${action.description}`).join("\n")}

Source :
${input.contentSource}
`.trim();
}

export async function applyMassiveCorrection(input: {
  contentSource: string;
  family: DocumentFamily;
  correctionPlan: CorrectionPlan;
}): Promise<MassiveCorrectionResult> {
  const previousScore = scoreDocument({ contentSource: input.contentSource, family: input.family });
  let correctedSource = input.contentSource.trim();
  const changeLog: string[] = [];

  for (const action of input.correctionPlan.actions) {
    if (action.type === "add_bcvb_identity") {
      correctedSource = addBcvbIdentity(correctedSource);
      changeLog.push("Identité BCVB ajoutée ou renforcée.");
    }

    if (action.type === "improve_tables") {
      correctedSource = normalizeTables(correctedSource);
      changeLog.push("Tableaux OCR bruts convertis en tableaux Markdown normalisés.");
    }

    if (action.type === "improve_situations") {
      correctedSource = addSituationTemplate(correctedSource);
      changeLog.push("Bloc situation pédagogique ajouté comme structure à valider.");
    }

    if (action.type === "improve_export_readiness") {
      correctedSource = addExportNotes(correctedSource);
      changeLog.push("Checklist publication/export ajoutée.");
    }

    if (action.type === "restructure" || action.type === "add_missing_sections") {
      correctedSource = ensureSection(correctedSource, "Introduction", "Objectif du document, public cible et usage club à valider.");
      correctedSource = ensureSection(correctedSource, "Contenu structuré", "Les informations source sont organisées pour une lecture club.");
      correctedSource = ensureSection(correctedSource, "Points de vigilance", "Les passages incertains doivent être relus avant publication.");
      changeLog.push("Structure éditoriale renforcée avec sections de publication.");
    }

    if (action.type === "improve_style") {
      correctedSource = correctedSource.replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ");
      changeLog.push("Micro-correction de style et d’espacement appliquée.");
    }
  }

  const newScore = scoreDocument({ contentSource: correctedSource, family: input.family });

  if (changeLog.length === 0) {
    changeLog.push("Aucune correction automatique appliquée : le document doit être relu humainement.");
  }

  return {
    correctedSource,
    changeLog,
    previousScore,
    newScore,
  };
}
