import type {
  Player,
  RosterImportResult,
  RosterImportRow,
  RosterPlanningContext,
  RosterQualityScore,
  Team,
} from "../../types/roster";
import { allImportRows } from "./rosterImport";

function hasFamilyContact(row: RosterImportRow) {
  return Boolean(row.contacts?.some((contact) => contact.email || contact.phone));
}

function rowTeamName(row: RosterImportRow) {
  return row.targetTeamName || row.raw["Équipe"] || row.raw["Equipe"] || row.raw.team || "";
}

export function scoreRosterRow(row: RosterImportRow) {
  const player = row.mapped || {};
  let score = 0;

  if (player.firstName && player.lastName) score += 20;
  if (player.birthDate) score += 10;
  if (player.licenseNumber) score += 10;
  if (rowTeamName(row)) score += 20;
  if (hasFamilyContact(row)) score += 15;
  if ((row.duplicateScore || 0) < 80) score += 15;
  if (player.status) score += 10;

  return score;
}

export function scoreRosterQuality(result: RosterImportResult | null): RosterQualityScore {
  const rows = allImportRows(result);
  const score = rows.length
    ? Math.round(rows.reduce((total, row) => total + scoreRosterRow(row), 0) / rows.length)
    : 0;
  const playersWithoutTeam = rows.filter((row) => !rowTeamName(row)).length;
  const playersWithoutContact = rows.filter((row) => !hasFamilyContact(row)).length;
  const probableDuplicates = rows.filter((row) => (row.duplicateScore || 0) >= 80).length;
  const errorRows = result?.invalidRows.length || 0;
  const actions: string[] = [];
  const strengths: string[] = [];

  if (rows.length > 0) strengths.push("Prévisualisation import disponible avant validation.");
  if (playersWithoutTeam === 0 && rows.length > 0) strengths.push("Tous les joueurs ont une équipe cible.");
  if (playersWithoutContact === 0 && rows.length > 0) strengths.push("Les contacts familles sont complets.");
  if (probableDuplicates === 0 && rows.length > 0) strengths.push("Aucun doublon critique détecté.");

  if (errorRows > 0) actions.push("Corriger les lignes en erreur avant validation.");
  if (playersWithoutTeam > 0) actions.push("Affecter les joueurs sans équipe à une équipe et une saison.");
  if (playersWithoutContact > 0) actions.push("Compléter les contacts familles prioritaires.");
  if (probableDuplicates > 0) actions.push("Arbitrer les doublons probables avant import définitif.");
  if (rows.length === 0) actions.push("Importer un fichier CSV, XLS ou XLSX pour lancer le contrôle.");

  return {
    score,
    playerCount: rows.length,
    playersWithoutTeam,
    playersWithoutContact,
    probableDuplicates,
    importedRows: rows.length,
    errorRows,
    strengths,
    actions,
  };
}

function birthYear(player: Partial<Player>) {
  const year = Number((player.birthDate || "").slice(0, 4));
  return Number.isFinite(year) && year > 1900 ? year : null;
}

export function buildPlanningContextFromTeam(team: Partial<Team>, players: Array<Partial<Player>>): RosterPlanningContext {
  const years = players
    .map(birthYear)
    .filter((year): year is number => Boolean(year))
    .sort((a, b) => a - b);
  const alerts: string[] = [];
  const suggestedPriorities: string[] = [];
  const trainingFrequency = team.trainingFrequencyPerWeek || 2;

  if (players.length < 8) alerts.push("Effectif court : prévoir des passerelles avec une autre équipe.");
  if (players.length > 16) alerts.push("Effectif dense : prévoir des ateliers par groupes de niveau.");
  if (trainingFrequency <= 1) alerts.push("Fréquence faible : prioriser les fondamentaux et la régularité.");
  if (team.heterogeneityLevel === "fort") {
    alerts.push("Hétérogénéité forte : différencier les consignes et les critères de réussite.");
    suggestedPriorities.push("Groupes de besoin", "Fondamentaux individualisés");
  }

  if (team.category === "U7" || team.category === "U9" || team.category === "U11") {
    suggestedPriorities.push("Motricité", "Appuis", "Découverte du jeu rapide");
  } else if (team.category === "U13" || team.category === "U15") {
    suggestedPriorities.push("1 contre 1", "Défendre fort", "Partager la balle");
  } else {
    suggestedPriorities.push("Lecture de jeu", "Projet collectif", "Préparation match");
  }

  return {
    category: team.category,
    level: team.level,
    playerCount: players.length,
    ageRange: years.length ? `${years[0]}-${years[years.length - 1]}` : "Non renseigné",
    trainingConstraints: team.constraints || [],
    recommendedPlanningDensity: trainingFrequency >= 3 ? "renforcée" : trainingFrequency <= 1 ? "faible" : "standard",
    alerts,
    suggestedPriorities: Array.from(new Set([...(team.objectives || []), ...suggestedPriorities])),
  };
}

