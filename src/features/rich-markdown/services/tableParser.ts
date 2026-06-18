export interface ParsedTable {
  id: string;
  raw: string;
  source: "markdown" | "ocr";
  headers: string[];
  rows: string[][];
  caption?: string;
  warnings: string[];
}

export interface NormalizedTable {
  id: string;
  headers: string[];
  rows: string[][];
  source: "markdown" | "ocr";
  caption?: string;
  warnings: string[];
  compact: boolean;
  fullWidth: boolean;
}

function splitPipeRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cleanCell(cell));
}

function isSeparator(line: string) {
  return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(line);
}

function isPipeTableLine(line: string) {
  return line.includes("|") && splitPipeRow(line).filter(Boolean).length >= 2;
}

function isPipeTableStart(lines: string[], startIndex: number) {
  if (!isPipeTableLine(lines[startIndex])) return false;
  const nextLine = lines[startIndex + 1] ?? "";
  return isSeparator(nextLine) || isPipeTableLine(nextLine);
}

function cleanCell(cell: string) {
  return cell.replace(/\s+/g, " ").replace(/^["“”]+|["“”]+$/g, "").trim();
}

function getCaption(lines: string[], startIndex: number) {
  const previous = lines[startIndex - 1]?.trim() ?? "";
  const caption = /^(?:tableau|table)\s*(?:[:\-–]\s*)?(.+)$/i.exec(previous);
  return caption?.[1]?.trim();
}

function parsePipeTable(lines: string[], startIndex: number, caption?: string): { table: ParsedTable; endIndex: number } {
  const tableLines: string[] = [];
  let index = startIndex;

  while (index < lines.length && isPipeTableLine(lines[index])) {
    tableLines.push(lines[index]);
    index += 1;
  }

  const rows = tableLines.filter((line) => !isSeparator(line)).map(splitPipeRow);
  const headers = rows[0] ?? [];
  const bodyRows = rows.slice(1);
  const warnings: string[] = [];

  if (!tableLines.some(isSeparator)) warnings.push("Tableau Markdown sans séparateur : structure à vérifier.");
  if (headers.length > 6) warnings.push("Tableau trop large : utiliser pleine largeur ou format paysage.");
  if (bodyRows.some((row) => row.length !== headers.length)) warnings.push("Colonnes irrégulières détectées.");
  if (headers.some((header) => header.length === 0)) warnings.push("En-tête vide détecté.");

  return {
    endIndex: index,
    table: {
      id: `table-${startIndex + 1}`,
      raw: tableLines.join("\n"),
      source: "markdown",
      headers,
      rows: bodyRows,
      caption,
      warnings,
    },
  };
}

function isOcrTableLine(line: string) {
  return !line.includes("|") && /(\t|\s{2,})/.test(line.trim()) && line.trim().split(/\t|\s{2,}/).length >= 2;
}

function isOcrTableStart(lines: string[], startIndex: number) {
  return isOcrTableLine(lines[startIndex]) && isOcrTableLine(lines[startIndex + 1] ?? "");
}

function splitOcrRow(line: string) {
  return line
    .trim()
    .split(/\t|\s{2,}/)
    .map((cell) => cleanCell(cell));
}

function parseOcrTable(lines: string[], startIndex: number, caption?: string): { table: ParsedTable; endIndex: number } {
  const tableLines: string[] = [];
  let index = startIndex;

  while (index < lines.length && isOcrTableLine(lines[index])) {
    tableLines.push(lines[index]);
    index += 1;
  }

  const rows = tableLines.map(splitOcrRow);
  const maxColumns = Math.max(...rows.map((row) => row.length));
  const headers = rows[0] ?? Array.from({ length: maxColumns }, (_, columnIndex) => `Colonne ${columnIndex + 1}`);
  const warnings = ["Tableau OCR détecté : structure à vérifier."];

  if (maxColumns > 6) warnings.push("Tableau trop large : utiliser pleine largeur ou format paysage.");
  if (rows.some((row) => row.length !== maxColumns)) warnings.push("Colonnes OCR irrégulières détectées.");

  return {
    endIndex: index,
    table: {
      id: `ocr-table-${startIndex + 1}`,
      raw: tableLines.join("\n"),
      source: "ocr",
      headers,
      rows: rows.slice(1),
      caption,
      warnings,
    },
  };
}

export function parseMarkdownTables(content: string): ParsedTable[] {
  const lines = content.split("\n");
  const tables: ParsedTable[] = [];
  let index = 0;

  while (index < lines.length) {
    if (isPipeTableStart(lines, index)) {
      const parsed = parsePipeTable(lines, index, getCaption(lines, index));
      tables.push(parsed.table);
      index = parsed.endIndex;
      continue;
    }

    if (isOcrTableStart(lines, index)) {
      const parsed = parseOcrTable(lines, index, getCaption(lines, index));
      tables.push(parsed.table);
      index = parsed.endIndex;
      continue;
    }

    index += 1;
  }

  return tables;
}

export function normalizeTable(table: ParsedTable): NormalizedTable {
  const columnCount = Math.max(table.headers.length, ...table.rows.map((row) => row.length), 1);
  const headers = Array.from({ length: columnCount }, (_, index) => cleanCell(table.headers[index] || `Colonne ${index + 1}`));
  const rows = table.rows.map((row) => Array.from({ length: columnCount }, (_, index) => cleanCell(row[index] || "")));
  const warnings = [...table.warnings];
  const duplicatedHeaders = headers.filter((header, index) => headers.indexOf(header) !== index);

  if (columnCount > 7) warnings.push("Tableau très large : vérifier en A4 paysage.");
  if (duplicatedHeaders.length > 0) warnings.push("En-têtes dupliqués détectés.");
  if (rows.some((row) => row.some((cell) => cell.length > 140))) warnings.push("Cellule très longue : préférer une version compacte ou une liste.");

  return {
    id: table.id,
    headers,
    rows,
    source: table.source,
    caption: table.caption,
    warnings: Array.from(new Set(warnings)),
    compact: columnCount >= 5,
    fullWidth: columnCount >= 6,
  };
}

export function renderTableBlock(table: NormalizedTable) {
  return table;
}
