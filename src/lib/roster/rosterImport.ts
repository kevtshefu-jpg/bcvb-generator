import * as Papa from "papaparse";
import * as XLSX from "xlsx";
import type {
  ImportedRosterRow,
  Player,
  RosterImportColumnMapping,
  RosterImportReport,
  RosterImportResult,
  RosterImportRow,
} from "../../types/roster";
import { detectDuplicatePlayers } from "./rosterDuplicate";
import { inferRosterMapping, mapRosterContacts, mapRosterRow } from "./rosterMapping";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeRecord(record: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, String(value || "").trim()])
  );
}

function hasValue(row: Record<string, unknown>) {
  return Object.values(row).some((value) => String(value || "").trim().length > 0);
}

async function readWorkbook(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    const text = await file.text();
    return XLSX.read(text, { type: "string" });
  }

  if (extension === "xls" || extension === "xlsx") {
    const buffer = await file.arrayBuffer();
    return XLSX.read(buffer, { type: "array" });
  }

  throw new Error("Format non reconnu. Importez un fichier .csv, .xls ou .xlsx.");
}

async function readCsvRows(file: File): Promise<Record<string, unknown>[]> {
  const text = await file.text();
  const parsed = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    throw new Error(parsed.errors[0]?.message || "CSV illisible.");
  }

  return parsed.data;
}

function buildRows(
  records: Record<string, unknown>[],
  mapping: RosterImportColumnMapping,
  existingPlayers: Partial<Player>[] = []
): RosterImportRow[] {
  const previouslyParsed: Partial<Player>[] = [];

  return records.map((row, index) => {
    const id = uid(`row_${index + 1}`);
    const raw = normalizeRecord(row);
    const mapped = mapRosterRow(raw, mapping);
    const contacts = mapRosterContacts(id, raw, mapping);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!mapped.firstName) errors.push("Prénom manquant.");
    if (!mapped.lastName) errors.push("Nom manquant.");
    if (!mapped.birthDate) warnings.push("Date de naissance absente.");
    if (!mapped.licenseNumber) warnings.push("Numéro de licence absent.");
    if (!contacts.some((contact) => contact.phone || contact.email)) {
      warnings.push("Contact famille principal absent.");
    }

    const duplicateResult = detectDuplicatePlayers(mapped, [...existingPlayers, ...previouslyParsed]);

    if (duplicateResult.score >= 80) {
      warnings.push("Doublon probable détecté.");
    } else if (duplicateResult.score >= 60) {
      warnings.push("Correspondance joueur à vérifier.");
    }

    previouslyParsed.push({
      ...mapped,
      id,
    });

    return {
      id,
      sourceLine: index + 2,
      raw,
      mapped,
      contacts,
      errors,
      warnings,
      duplicateScore: duplicateResult.score,
      possibleDuplicateIds: duplicateResult.possibleDuplicateIds,
      targetTeamName: mapping.team ? raw[mapping.team] || "" : "",
      membershipRole: "joueur",
    };
  });
}

export function buildRosterImportResult(
  fileName: string,
  records: Record<string, unknown>[],
  mapping: RosterImportColumnMapping,
  existingPlayers: Partial<Player>[] = []
): RosterImportResult {
  const cleanedRows = records.filter(hasValue);
  const columns = Object.keys(cleanedRows[0] || {});
  const parsedRows = buildRows(cleanedRows, mapping, existingPlayers);

  return {
    fileName,
    columns,
    rowCount: parsedRows.length,
    validRows: parsedRows.filter((row) => row.errors.length === 0 && !row.ignored),
    invalidRows: parsedRows.filter((row) => row.errors.length > 0 && !row.ignored),
    warnings: parsedRows.flatMap((row) => row.warnings),
    mapping,
  };
}

export async function parseRosterFile(
  file: File,
  existingPlayers: Partial<Player>[] = []
): Promise<RosterImportResult> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    const rows = await readCsvRows(file);
    const cleanedRows = rows.filter(hasValue);
    const columns = Object.keys(cleanedRows[0] || {});
    const mapping = inferRosterMapping(columns);
    return buildRosterImportResult(file.name, cleanedRows, mapping, existingPlayers);
  }

  const workbook = await readWorkbook(file);
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("Aucune feuille détectée dans le fichier.");
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  const cleanedRows = rows.filter(hasValue);
  const columns = Object.keys(cleanedRows[0] || {});
  const mapping = inferRosterMapping(columns);

  return buildRosterImportResult(file.name, cleanedRows, mapping, existingPlayers);
}

export function remapRosterImportResult(
  result: RosterImportResult,
  mapping: RosterImportColumnMapping,
  existingPlayers: Partial<Player>[] = []
): RosterImportResult {
  const records = [...result.validRows, ...result.invalidRows]
    .sort((a, b) => a.sourceLine - b.sourceLine)
    .map((row) => row.raw);

  return buildRosterImportResult(result.fileName, records, mapping, existingPlayers);
}

export function allImportRows(result: RosterImportResult | null) {
  if (!result) return [];
  return [...result.validRows, ...result.invalidRows].sort((a, b) => a.sourceLine - b.sourceLine);
}

export function buildRosterImportReport(result: RosterImportResult | null): RosterImportReport {
  const rows = allImportRows(result);
  const importedRows: ImportedRosterRow[] = rows.map((row) => ({
    id: row.id,
    raw: row.raw,
    mapped: {
      ...(row.mapped || {}),
      teamName: row.targetTeamName,
      parent1Email: row.contacts?.[0]?.email,
      parent1Phone: row.contacts?.[0]?.phone,
      parent2Email: row.contacts?.[1]?.email,
      parent2Phone: row.contacts?.[1]?.phone,
    },
    errors: row.errors,
    warnings: row.warnings,
    duplicateScore: row.duplicateScore,
    duplicatePlayerId: row.possibleDuplicateIds?.[0],
  }));

  return {
    totalRows: rows.length,
    validRows: rows.filter((row) => row.errors.length === 0 && !row.ignored).length,
    warningRows: rows.filter((row) => row.warnings.length > 0 && row.errors.length === 0 && !row.ignored).length,
    errorRows: rows.filter((row) => row.errors.length > 0 && !row.ignored).length,
    possibleDuplicates: rows.filter((row) => (row.duplicateScore || 0) >= 60).length,
    rows: importedRows,
  };
}
