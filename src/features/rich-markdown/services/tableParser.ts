export interface ParsedTable {
  id: string;
  raw: string;
  headers: string[];
  rows: string[][];
  caption?: string;
  warnings: string[];
}

export interface NormalizedTable {
  id: string;
  headers: string[];
  rows: string[][];
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
    .map((cell) => cell.trim());
}

function isSeparator(line: string) {
  return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(line);
}

function isPipeTableLine(line: string) {
  return line.includes("|") && splitPipeRow(line).length >= 2;
}

function parsePipeTable(lines: string[], startIndex: number): { table: ParsedTable; endIndex: number } {
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

  if (headers.length > 6) warnings.push("Tableau trop large : utiliser pleine largeur ou format paysage.");
  if (bodyRows.some((row) => row.length !== headers.length)) warnings.push("Colonnes irrégulières détectées.");

  return {
    endIndex: index,
    table: {
      id: `table-${startIndex + 1}`,
      raw: tableLines.join("\n"),
      headers,
      rows: bodyRows,
      warnings,
    },
  };
}

function isOcrTableLine(line: string) {
  return !line.includes("|") && /(\t|\s{2,})/.test(line.trim()) && line.trim().split(/\t|\s{2,}/).length >= 2;
}

function parseOcrTable(lines: string[], startIndex: number): { table: ParsedTable; endIndex: number } {
  const tableLines: string[] = [];
  let index = startIndex;

  while (index < lines.length && isOcrTableLine(lines[index])) {
    tableLines.push(lines[index]);
    index += 1;
  }

  const rows = tableLines.map((line) => line.trim().split(/\t|\s{2,}/).map((cell) => cell.trim()));
  const maxColumns = Math.max(...rows.map((row) => row.length));
  const headers = rows[0] ?? Array.from({ length: maxColumns }, (_, columnIndex) => `Colonne ${columnIndex + 1}`);
  const warnings = ["Tableau OCR détecté : structure à vérifier."];

  if (maxColumns > 6) warnings.push("Tableau trop large : utiliser pleine largeur ou format paysage.");

  return {
    endIndex: index,
    table: {
      id: `ocr-table-${startIndex + 1}`,
      raw: tableLines.join("\n"),
      headers,
      rows: rows.slice(1),
      warnings,
    },
  };
}

export function parseMarkdownTables(content: string): ParsedTable[] {
  const lines = content.split("\n");
  const tables: ParsedTable[] = [];
  let index = 0;

  while (index < lines.length) {
    if (isPipeTableLine(lines[index])) {
      const parsed = parsePipeTable(lines, index);
      tables.push(parsed.table);
      index = parsed.endIndex;
      continue;
    }

    if (isOcrTableLine(lines[index])) {
      const parsed = parseOcrTable(lines, index);
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
  const headers = Array.from({ length: columnCount }, (_, index) => table.headers[index] || `Colonne ${index + 1}`);
  const rows = table.rows.map((row) => Array.from({ length: columnCount }, (_, index) => row[index] || ""));
  const warnings = [...table.warnings];

  if (columnCount > 7) warnings.push("Tableau très large : vérifier en A4 paysage.");

  return {
    id: table.id,
    headers,
    rows,
    caption: table.caption,
    warnings: Array.from(new Set(warnings)),
    compact: columnCount >= 5,
    fullWidth: columnCount >= 6,
  };
}

export function renderTableBlock(table: NormalizedTable) {
  return table;
}
