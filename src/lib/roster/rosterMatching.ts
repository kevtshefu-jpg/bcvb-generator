import type { Player, RosterImportRow } from "../../types/roster";
import { detectDuplicatePlayers, describeDuplicate, getDuplicateRows } from "./rosterDuplicate";

function clean(value?: string) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

export function computeRosterMatchScore(candidate: Partial<Player>, existing: Partial<Player>) {
  let score = 0;
  const reasons: string[] = [];

  if (clean(candidate.lastName) && clean(candidate.lastName) === clean(existing.lastName)) {
    score += 35;
    reasons.push("Nom identique");
  }

  if (clean(candidate.firstName) && clean(candidate.firstName) === clean(existing.firstName)) {
    score += 30;
    reasons.push("Prénom identique");
  }

  if (candidate.birthDate && existing.birthDate && candidate.birthDate === existing.birthDate) {
    score += 25;
    reasons.push("Date de naissance identique");
  }

  if (candidate.licenseNumber && existing.licenseNumber && clean(candidate.licenseNumber) === clean(existing.licenseNumber)) {
    score += 60;
    reasons.push("Licence identique");
  }

  return {
    score: Math.min(score, 100),
    reasons,
    suggestedAction: score >= 90 ? "fusionner" as const : score >= 60 ? "verifier" as const : "ignorer" as const,
  };
}

export function findRosterDuplicates(candidate: Partial<Player>, existingPlayers: Partial<Player>[]) {
  return detectDuplicatePlayers(candidate, existingPlayers);
}

export function getRosterDuplicateRows(rows: RosterImportRow[]) {
  return getDuplicateRows(rows);
}

export function describeRosterDuplicate(row: RosterImportRow) {
  return describeDuplicate(row);
}
