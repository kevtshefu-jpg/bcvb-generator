export type PdfExportEngine =
  | "jspdf_html2canvas"
  | "browser_print_fallback"
  | "future_backend";

export type PdfExportWarningLevel = "info" | "warning" | "critical";

export interface PdfExportWarning {
  id: string;
  level: PdfExportWarningLevel;
  message: string;
  action: string;
}

export interface PdfExportReadiness {
  score: number;
  recommendedOrientation: "portrait" | "landscape";
  tableCount: number;
  wideTableCount: number;
  protectedBlockCount: number;
  oversizedBlockCount: number;
  uiElementCount: number;
  warnings: PdfExportWarning[];
}

export interface PdfExportResult {
  engine: PdfExportEngine;
  fileName: string;
  orientation: "portrait" | "landscape";
  exportedAt: string;
  fallbackUsed: boolean;
  warnings: PdfExportWarning[];
}
