import type {
  LegacyRosterImportRow,
  RosterImportField,
  RosterImportPreview,
} from "../types/roster";
import { allImportRows, parseRosterFile as parseRosterFileV2 } from "./roster/rosterImport";
import { inferRosterMapping as inferRosterColumnMapping } from "./roster/rosterMapping";

export const ROSTER_FIELDS: Array<{ key: RosterImportField; label: string; required?: boolean }> = [
  { key: "last_name", label: "Nom", required: true },
  { key: "first_name", label: "Prénom", required: true },
  { key: "birth_date", label: "Date de naissance" },
  { key: "category", label: "Catégorie" },
  { key: "team", label: "Équipe" },
  { key: "gender", label: "Sexe" },
  { key: "height_cm", label: "Taille" },
  { key: "position", label: "Poste" },
  { key: "parent_1_name", label: "Parent 1" },
  { key: "parent_2_name", label: "Parent 2" },
  { key: "parent_1_phone", label: "Téléphone parent 1" },
  { key: "parent_2_phone", label: "Téléphone parent 2" },
  { key: "parent_1_email", label: "Email parent 1" },
  { key: "parent_2_email", label: "Email parent 2" },
  { key: "emergency_phone", label: "Téléphone urgence" },
  { key: "license_number", label: "Licence" },
  { key: "license_status", label: "Statut licence" },
  { key: "head_coach", label: "Coach référent" },
  { key: "parent_referent", label: "Parent référent" },
  { key: "notes", label: "Commentaires" },
];

const fieldToColumnMappingKey: Partial<Record<RosterImportField, string>> = {
  first_name: "firstName",
  last_name: "lastName",
  birth_date: "birthDate",
  gender: "gender",
  license_number: "licenseNumber",
  parent_1_name: "parent1Name",
  parent_1_email: "parent1Email",
  parent_1_phone: "parent1Phone",
  parent_2_name: "parent2Name",
  parent_2_email: "parent2Email",
  parent_2_phone: "parent2Phone",
  category: "category",
  team: "team",
  notes: "notes",
};

export function inferRosterMapping(headers: string[]) {
  const columnMapping = inferRosterColumnMapping(headers);
  return headers.reduce<Record<string, RosterImportField | "">>((mapping, header) => {
    const match = Object.entries(fieldToColumnMappingKey).find(([, key]) =>
      columnMapping[key as keyof typeof columnMapping] === header
    );
    mapping[header] = (match?.[0] as RosterImportField | undefined) || "";
    return mapping;
  }, {});
}

export function applyRosterMapping(
  rawRows: Array<{ sourceLine: number; raw: Record<string, string> }>,
  mapping: Record<string, RosterImportField | "">
) {
  return rawRows.map((rawRow) => {
    const row: LegacyRosterImportRow = { sourceLine: rawRow.sourceLine, raw: rawRow.raw };
    Object.entries(rawRow.raw).forEach(([header, value]) => {
      const field = mapping[header];
      if (field) row[field] = value;
    });
    return row;
  });
}

function hasContact(row: LegacyRosterImportRow) {
  return Boolean(row.parent_1_phone || row.parent_2_phone || row.parent_1_email || row.parent_2_email || row.emergency_phone);
}

function isContactComplete(row: LegacyRosterImportRow) {
  const hasPhone = Boolean(row.parent_1_phone || row.parent_2_phone || row.emergency_phone);
  const hasEmail = Boolean(row.parent_1_email || row.parent_2_email);
  return hasPhone && hasEmail;
}

export function analyzeRosterRows(
  rows: LegacyRosterImportRow[],
  headers: string[],
  mapping: Record<string, RosterImportField | "">
): RosterImportPreview {
  const seen = new Map<string, LegacyRosterImportRow>();
  const duplicates: LegacyRosterImportRow[] = [];
  const duplicateCandidates: RosterImportPreview["duplicateCandidates"] = [];
  const invalidRows: Array<{ line: number; reason: string }> = [];

  rows.forEach((row) => {
    if (!row.last_name || !row.first_name) {
      invalidRows.push({ line: row.sourceLine, reason: "Nom ou prénom manquant." });
    }
    const key = `${row.last_name || ""}|${row.first_name || ""}|${row.birth_date || ""}`.toLowerCase();
    if (seen.has(key)) {
      const matched = seen.get(key);
      duplicates.push(row);
      duplicateCandidates.push({
        id: `${matched?.sourceLine || 0}-${row.sourceLine}`,
        sourceLine: row.sourceLine,
        matchedWithLine: matched?.sourceLine || row.sourceLine,
        score: 98,
        reasons: ["Nom, prénom et date de naissance identiques"],
        suggestedAction: "fusionner",
      });
    } else {
      seen.set(key, row);
    }
  });

  const categories = Array.from(new Set(rows.map((row) => row.category).filter(Boolean) as string[]));
  const teams = Array.from(new Set(rows.map((row) => row.team).filter(Boolean) as string[]));
  const mappedFields = new Set(Object.values(mapping).filter(Boolean));
  const missingFields = ROSTER_FIELDS.filter((field) => field.required && !mappedFields.has(field.key)).map((field) => field.label);
  const contactSummary = rows.reduce(
    (summary, row) => {
      summary.total += 1;
      if (isContactComplete(row)) summary.complete += 1;
      else if (hasContact(row)) summary.partial += 1;
      else summary.missing += 1;
      if (row.parent_referent) summary.parentReferents += 1;
      return summary;
    },
    { total: 0, complete: 0, partial: 0, missing: 0, parentReferents: 0 }
  );
  const teamAssignments = teams.map((team) => ({
    id: team.toLowerCase(),
    teamName: team,
    category: rows.find((row) => row.team === team)?.category || "Catégorie à vérifier",
    season: "2026-2027",
    playersCount: rows.filter((row) => row.team === team).length,
    mode: "existing" as const,
  }));
  const playerPassports = rows.filter((row) => row.first_name || row.last_name).map((row) => ({
    id: `passport-${row.sourceLine}`,
    sourceLine: row.sourceLine,
    displayName: `${row.first_name || ""} ${row.last_name || ""}`.trim() || `Ligne ${row.sourceLine}`,
    category: row.category || "À classer",
    team: row.team || "À affecter",
    licenseNumber: row.license_number,
    contactStatus: isContactComplete(row) ? "complet" as const : hasContact(row) ? "partiel" as const : "manquant" as const,
    trackingLinks: {
      attendance: true,
      evaluations: true,
      objectives: false,
      documents: false,
    },
  }));

  return {
    rows,
    headers,
    mapping,
    duplicates,
    duplicateCandidates,
    invalidRows,
    categories,
    teams,
    missingFields,
    contactSummary,
    teamAssignments,
    playerPassports,
  };
}

export async function parseRosterFile(file: File): Promise<RosterImportPreview> {
  const result = await parseRosterFileV2(file);
  const rows = allImportRows(result).map((row) => ({
    sourceLine: row.sourceLine,
    raw: row.raw,
    first_name: row.mapped?.firstName,
    last_name: row.mapped?.lastName,
    birth_date: row.mapped?.birthDate,
    gender: row.mapped?.gender,
    category: row.mapped?.category,
    team: row.targetTeamName,
    license_number: row.mapped?.licenseNumber,
    notes: row.mapped?.notes,
    parent_1_name: row.contacts?.[0]?.firstName,
    parent_1_email: row.contacts?.[0]?.email,
    parent_1_phone: row.contacts?.[0]?.phone,
    parent_2_name: row.contacts?.[1]?.firstName,
    parent_2_email: row.contacts?.[1]?.email,
    parent_2_phone: row.contacts?.[1]?.phone,
  })) satisfies LegacyRosterImportRow[];

  return analyzeRosterRows(rows, result.columns, inferRosterMapping(result.columns));
}

export { buildRosterImportResult, remapRosterImportResult } from "./roster/rosterImport";

