import type { Player, RosterImportRow } from "../../types/roster";

function clean(value?: string) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

export function detectDuplicatePlayers(
  candidate: Partial<Player>,
  existingPlayers: Partial<Player>[]
) {
  let bestScore = 0;
  const possibleDuplicateIds: string[] = [];

  for (const player of existingPlayers) {
    let score = 0;

    if (clean(candidate.lastName) && clean(candidate.lastName) === clean(player.lastName)) {
      score += 35;
    }

    if (clean(candidate.firstName) && clean(candidate.firstName) === clean(player.firstName)) {
      score += 30;
    }

    if (candidate.birthDate && player.birthDate && candidate.birthDate === player.birthDate) {
      score += 25;
    }

    if (
      candidate.licenseNumber &&
      player.licenseNumber &&
      clean(candidate.licenseNumber) === clean(player.licenseNumber)
    ) {
      score += 60;
    }

    if (score >= 60 && player.id) {
      possibleDuplicateIds.push(player.id);
    }

    bestScore = Math.max(bestScore, score);
  }

  return {
    score: Math.min(bestScore, 100),
    possibleDuplicateIds,
  };
}

export function getDuplicateRows(rows: RosterImportRow[]) {
  return rows.filter((row) => (row.duplicateScore || 0) >= 60);
}

export function describeDuplicate(row: RosterImportRow) {
  if ((row.duplicateScore || 0) >= 90) return "Doublon très probable";
  if ((row.duplicateScore || 0) >= 80) return "Doublon probable";
  if ((row.duplicateScore || 0) >= 60) return "Correspondance à vérifier";
  return "Aucun doublon critique";
}

