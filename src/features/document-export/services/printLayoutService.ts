import type { PdfExportReadiness, PdfExportWarning } from "../types/export.types";

export type PrintOrientation = "portrait" | "landscape";

const DYNAMIC_PRINT_STYLE_ID = "bcvb-dynamic-print-page-style";

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function upsertDynamicPrintStyle(orientation: PrintOrientation) {
  const existing = document.getElementById(DYNAMIC_PRINT_STYLE_ID);
  if (existing) existing.remove();

  const style = document.createElement("style");
  style.id = DYNAMIC_PRINT_STYLE_ID;
  style.textContent = `
@page {
  size: A4 ${orientation};
  margin: 14mm 12mm 16mm;
}

@media print {
  html[data-print-orientation="${orientation}"] .bcvb-print-exporting {
    min-height: auto !important;
  }
}
`;
  document.head.appendChild(style);

  return () => {
    style.remove();
  };
}

function buildWarning(
  id: string,
  level: PdfExportWarning["level"],
  message: string,
  action: string
): PdfExportWarning {
  return { id, level, message, action };
}

export function analyzePrintReadiness(element: HTMLElement | null): PdfExportReadiness {
  if (!element) {
    return {
      score: 0,
      recommendedOrientation: "portrait",
      tableCount: 0,
      wideTableCount: 0,
      protectedBlockCount: 0,
      oversizedBlockCount: 0,
      uiElementCount: 0,
      warnings: [
        buildWarning(
          "missing-export-root",
          "critical",
          "Zone exportable introuvable.",
          "Vérifier l’identifiant de la zone de prévisualisation."
        ),
      ],
    };
  }

  const tables = Array.from(element.querySelectorAll(".bcvb-table-block, .bcvb-table"));
  const wideTables = Array.from(element.querySelectorAll(".bcvb-table-block--full, .bcvb-table-block--compact"));
  const protectedBlocks = Array.from(
    element.querySelectorAll(".bcvb-block, .bcvb-card, .bcvb-table-block, .bcvb-situation, .bcvb-court, .bcvb-key")
  );
  const oversizedBlocks = protectedBlocks.filter((block) => block.getBoundingClientRect().height > 860);
  const uiElements = Array.from(element.querySelectorAll("button, input, textarea, select, [onclick]"));
  const warnings: PdfExportWarning[] = [];

  if (wideTables.length > 0) {
    warnings.push(
      buildWarning(
        "wide-tables",
        "warning",
        "Tableaux larges détectés : A4 paysage recommandé.",
        "Utiliser l’orientation paysage ou simplifier les colonnes."
      )
    );
  }

  if (oversizedBlocks.length > 0) {
    warnings.push(
      buildWarning(
        "oversized-blocks",
        "warning",
        "Certains blocs dépassent une page A4 et peuvent être coupés.",
        "Réduire ou diviser les blocs longs avant export."
      )
    );
  }

  if (uiElements.length > 0) {
    warnings.push(
      buildWarning(
        "ui-elements",
        "critical",
        "Éléments d’interface détectés dans la zone exportable.",
        "Retirer boutons, champs ou composants interactifs du contenu document."
      )
    );
  }

  const score = clampScore(100 - wideTables.length * 8 - oversizedBlocks.length * 14 - uiElements.length * 22);

  return {
    score,
    recommendedOrientation: wideTables.length > 0 ? "landscape" : "portrait",
    tableCount: tables.length,
    wideTableCount: wideTables.length,
    protectedBlockCount: protectedBlocks.length,
    oversizedBlockCount: oversizedBlocks.length,
    uiElementCount: uiElements.length,
    warnings,
  };
}

export function preparePrintLayout(contentElementId: string, orientation: PrintOrientation) {
  const element = document.getElementById(contentElementId);
  if (!element) throw new Error(`Contenu exportable introuvable : ${contentElementId}`);

  document.documentElement.dataset.printOrientation = orientation;
  element.classList.add("bcvb-print-exporting");
  const cleanupStyle = upsertDynamicPrintStyle(orientation);

  return () => {
    element.classList.remove("bcvb-print-exporting");
    delete document.documentElement.dataset.printOrientation;
    cleanupStyle();
  };
}

export function suggestPrintOrientation(element: HTMLElement | null): PrintOrientation {
  return analyzePrintReadiness(element).recommendedOrientation;
}
