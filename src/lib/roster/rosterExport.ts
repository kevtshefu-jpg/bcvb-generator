import type {
  FamilyContact,
  PlayerPassport,
  RosterImportResult,
  RosterPermissionSet,
  Team,
} from "../../types/roster";
import { allImportRows } from "./rosterImport";
import { buildPlanningContextFromTeam, scoreRosterQuality } from "./rosterScoring";

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function downloadRosterFile(fileName: string, content: string, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportTeamRosterCsv(result: RosterImportResult, permissions: RosterPermissionSet) {
  const rows = allImportRows(result).filter((row) => !row.ignored);
  const content = [
    ["ligne", "prenom", "nom", "naissance", "sexe", "licence", "categorie", "equipe", "statut"].join(";"),
    ...rows.map((row) => [
      row.sourceLine,
      row.mapped?.firstName,
      row.mapped?.lastName,
      row.mapped?.birthDate,
      row.mapped?.gender,
      row.mapped?.licenseNumber,
      row.mapped?.category,
      row.targetTeamName,
      row.mapped?.status,
    ].map(csvCell).join(";")),
  ].join("\n");

  if (!permissions.canExport) return;
  downloadRosterFile("effectif-equipe-bcvb.csv", content, "text/csv;charset=utf-8");
}

export function exportRosterJson(result: RosterImportResult, permissions: RosterPermissionSet) {
  if (!permissions.canExport) return;
  downloadRosterFile("effectif-source-bcvb.json", JSON.stringify(result, null, 2), "application/json;charset=utf-8");
}

export function exportPlayerPassportJson(passport: PlayerPassport, permissions: RosterPermissionSet) {
  if (!permissions.canExport) return;
  const safePassport = permissions.canViewSensitiveContacts
    ? passport
    : {
      ...passport,
      contacts: passport.contacts.map((contact) => ({
        ...contact,
        email: undefined,
        phone: undefined,
      })),
    };
  downloadRosterFile(`fiche-joueur-${passport.player.lastName || "bcvb"}.json`, JSON.stringify(safePassport, null, 2), "application/json;charset=utf-8");
}

export function exportFamilyContactsCsv(contacts: FamilyContact[], permissions: RosterPermissionSet) {
  if (!permissions.canExport || !permissions.canViewSensitiveContacts) return;
  const content = [
    ["joueur", "relation", "prenom", "nom", "email", "telephone", "referent", "notes"].join(";"),
    ...contacts.map((contact) => [
      contact.playerId,
      contact.relation,
      contact.firstName,
      contact.lastName,
      contact.email,
      contact.phone,
      contact.isParentReferent ? "oui" : "non",
      contact.notes,
    ].map(csvCell).join(";")),
  ].join("\n");
  downloadRosterFile("contacts-parents-bcvb.csv", content, "text/csv;charset=utf-8");
}

export function exportTechnicalTeamSummary(
  team: Partial<Team>,
  passports: PlayerPassport[],
  result: RosterImportResult | null,
  permissions: RosterPermissionSet
) {
  if (!permissions.canExport) return;
  const context = buildPlanningContextFromTeam(team, passports.map((passport) => passport.player));
  const quality = scoreRosterQuality(result);
  const content = {
    generatedAt: new Date().toISOString(),
    team,
    quality,
    planningContext: context,
    players: passports.map((passport) => ({
      id: passport.player.id,
      firstName: passport.player.firstName,
      lastName: passport.player.lastName,
      category: passport.player.category,
      status: passport.player.status,
      attendanceRate: passport.attendanceRate,
      evaluationSummary: passport.evaluationSummary,
      objectives: passport.objectives,
    })),
  };
  downloadRosterFile("synthese-equipe-responsable-technique.json", JSON.stringify(content, null, 2), "application/json;charset=utf-8");
}

