import type { CleanedOcrResult, OCRPageResult } from "../../../types/attachments";

function normalizeText(rawText: string) {
  return rawText
    .normalize("NFC")
    .replace(/[•●▪◦]/g, "-")
    .replace(/\r\n/g, "\n")
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .replace(/\bundefined\b|\[object Object\]/gi, "")
    .replace(/[^\S\n]{2,}/g, " ");
}

function looksLikeTable(line: string) {
  return line.includes("|") || /(\s{2,}|\t).+(\s{2,}|\t)/.test(line);
}

function looksLikeTitle(line: string) {
  return (
    line.length >= 5 &&
    line.length <= 84 &&
    /^[A-ZÀ-Ÿ0-9][A-ZÀ-Ÿ0-9\s'":/().-]+$/.test(line) &&
    !looksLikeTable(line)
  );
}

function computeTextConfidence(rawText: string, cleanedText: string) {
  if (!cleanedText.trim()) return 0;

  const parasiteCount = (rawText.match(/[�¤□■§©®~]{1}/g) ?? []).length;
  const emptyLineRatio = rawText.split("\n").filter((line) => !line.trim()).length / Math.max(1, rawText.split("\n").length);
  const lengthScore = Math.min(35, cleanedText.length / 20);
  const parasitePenalty = Math.min(30, parasiteCount * 4);
  const emptyPenalty = emptyLineRatio > 0.55 ? 16 : 0;

  return Math.max(12, Math.min(98, Math.round(58 + lengthScore - parasitePenalty - emptyPenalty)));
}

export function cleanOcrText(rawText: string): CleanedOcrResult {
  const lines = normalizeText(rawText)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => !/^\d+\s*(\/\s*\d+)?$/.test(line))
    .filter((line) => !/^page\s+\d+/i.test(line));

  const warnings = new Set<string>();
  const cleaned: string[] = [];

  for (const line of lines) {
    if (!line) {
      if (cleaned[cleaned.length - 1] !== "") cleaned.push("");
      continue;
    }

    if (/^[^\wÀ-ÿ|()-]{1,5}$/.test(line)) {
      warnings.add("OCR possiblement incomplet");
      continue;
    }

    if (looksLikeTable(line)) {
      warnings.add("Tableau détecté mais structure incertaine");
      cleaned.push(line.replace(/\t/g, " | ").replace(/\s{2,}/g, " | "));
      continue;
    }

    if (/terrain|sch[ée]ma|zone|fl[eè]che|joueur|plot|c[oô]ne/i.test(line)) {
      warnings.add("Schéma ou terrain détecté : vérification humaine nécessaire");
    }

    const previous = cleaned[cleaned.length - 1];
    const shouldJoin =
      previous &&
      previous !== "" &&
      !previous.endsWith(".") &&
      !previous.endsWith(":") &&
      !previous.startsWith("-") &&
      !looksLikeTitle(previous) &&
      !looksLikeTitle(line) &&
      /^[a-zà-ÿ(]/.test(line);

    if (shouldJoin) {
      cleaned[cleaned.length - 1] = `${previous} ${line}`;
    } else if (looksLikeTitle(line)) {
      cleaned.push(`## ${line.charAt(0)}${line.slice(1).toLowerCase()}`);
    } else {
      cleaned.push(line);
    }
  }

  const cleanedText = cleaned.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  const confidence = computeTextConfidence(rawText, cleanedText);

  if (cleanedText.length < 120) warnings.add("Texte très court");
  if (confidence < 62) warnings.add("OCR possiblement incomplet");

  return {
    cleanedText,
    confidence,
    warnings: Array.from(warnings),
  };
}

export function cleanOcrPages(pages: OCRPageResult[]) {
  return pages.map((page) => {
    const cleaned = cleanOcrText(page.rawText);
    const warnings = new Set([...page.warnings, ...cleaned.warnings]);

    if (!cleaned.cleanedText.trim()) warnings.add("Page peu lisible");
    if (cleaned.confidence < 62) warnings.add("Page peu lisible");

    return {
      ...page,
      cleanedText: cleaned.cleanedText,
      confidence: page.confidence > 0 ? Math.round((page.confidence + cleaned.confidence) / 2) : cleaned.confidence,
      warnings: Array.from(warnings),
    };
  });
}

export function computeAttachmentWarnings(pages: OCRPageResult[], rawText: string) {
  const warnings = new Set<string>();
  const emptyPages = pages.filter((page) => !page.cleanedText.trim());
  const lowConfidencePages = pages.filter((page) => page.confidence < 62);

  if (rawText.trim().length < 160) warnings.add("Texte très court");
  if (emptyPages.length > 0) warnings.add("Page peu lisible");
  if (lowConfidencePages.length > 0) warnings.add("OCR possiblement incomplet");
  if (/terrain|sch[ée]ma|diagramme|fl[eè]che/i.test(rawText)) {
    warnings.add("Schéma ou terrain détecté : vérification humaine nécessaire");
  }
  if (/\|.+\||\t/.test(rawText)) warnings.add("Tableau détecté mais structure incertaine");

  return Array.from(warnings);
}
