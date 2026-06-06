import type { AttachmentProcessingResult, BcvbDocumentType } from "../../../types/attachments";

export const bcvbDocumentTypeLabels: Record<BcvbDocumentType, string> = {
  guide_coach: "Guide coach",
  cahier_technique: "Cahier technique",
  fiche_seance: "Fiche séance",
  situation_pedagogique: "Situation pédagogique",
  compte_rendu: "Compte rendu",
  outil_evaluation: "Outil d’évaluation",
  document_familles: "Document familles",
  document_administratif: "Document administratif",
};

function formatWarnings(warnings: string[]) {
  if (warnings.length === 0) return "- Aucune alerte OCR détectée";
  return warnings.map((warning) => `- ${warning}`).join("\n");
}

function extractLine(pattern: RegExp, text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .find((line) => pattern.test(line));
}

function buildSessionDraft(result: AttachmentProcessingResult) {
  const source = result.cleanedText;
  const title = extractLine(/séance|entrainement|entraînement|u\d+|basket/i, source) ?? result.fileName;
  const objectives = source
    .split("\n")
    .filter((line) => /objectif|intention|th[eè]me/i.test(line))
    .slice(0, 5);
  const situations = source
    .split(/\n(?=situation|atelier|exercice|\d+\.)/i)
    .map((block) => block.trim())
    .filter((block) => /situation|atelier|exercice/i.test(block))
    .slice(0, 6);

  return `
:::bcvb-section
title: Fiche séance structurée depuis OCR
type: fiche_seance
:::

## Titre
${title}

## Date
À vérifier dans la source OCR.

## Catégorie
À vérifier dans la source OCR.

## Objectifs
${objectives.length > 0 ? objectives.map((line) => `- ${line}`).join("\n") : "- À compléter après relecture humaine."}

## Situations
${situations.length > 0 ? situations.map((block, index) => `### Situation ${index + 1}\n${block}`).join("\n\n") : "À structurer depuis le texte extrait."}

## Consignes
À reprendre depuis la source OCR sans inventer.

## Évolutions
À compléter après validation humaine.

## Bilan
À compléter par le coach.
`.trim();
}

function buildGenericDraft(result: AttachmentProcessingResult, documentType: BcvbDocumentType) {
  return `
:::bcvb-section
title: Contenu extrait
type: ${documentType}
:::

${result.cleanedText || "Aucun texte nettoyé disponible. Relancer l’extraction ou corriger manuellement."}
`.trim();
}

export async function transformAttachmentToBcvbMarkdown(
  result: AttachmentProcessingResult,
  documentType: BcvbDocumentType
): Promise<string> {
  const uncertainPages = result.pages
    .filter((page) => page.warnings.length > 0 || page.confidence < 62)
    .map((page) => `- Page ${page.pageNumber} (${page.confidence}%) : ${page.warnings.join(", ") || "à vérifier"}`);

  const sourceBlock = `
:::bcvb-source
type: OCR
file: ${result.fileName}
mode: ${result.metadata.extractionMode}
documentType: ${bcvbDocumentTypeLabels[documentType]}
confidence: ${result.confidence}%
warnings:
${formatWarnings(result.warnings)}
:::

:::bcvb-editor-note
Ce document provient d’une extraction OCR. Les passages signalés comme incertains doivent être relus avant publication. Aucun contenu non présent dans la source n’a été inventé.
:::
`.trim();

  const body =
    documentType === "fiche_seance" || documentType === "situation_pedagogique"
      ? buildSessionDraft(result)
      : buildGenericDraft(result, documentType);

  const uncertaintyBlock = `
:::bcvb-section
title: Incertitudes OCR à vérifier
:::

${uncertainPages.length > 0 ? uncertainPages.join("\n") : "- Aucune page incertaine détectée automatiquement."}
`.trim();

  return [sourceBlock, body, uncertaintyBlock].join("\n\n");
}
