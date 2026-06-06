import type { PlayerLogisticsAvailability, TeamLogisticsEvent } from "../../types/parentReferent";

export function computeParentReferentKpis(
  event: TeamLogisticsEvent | undefined,
  availabilities: PlayerLogisticsAvailability[],
  documentsCount: number,
  validatedMessagesCount: number
) {
  const playersToConfirm = availabilities.filter((item) => item.status === "to_confirm" || item.status === "not_filled").length;
  const carsAvailable = availabilities.filter((item) => item.carAvailable).length;
  const seatsAvailable = availabilities.reduce((sum, item) => sum + (item.availableSeats || 0), 0);
  const needs = [
    event?.transportNeeded ? "Transport" : "",
    event?.tableNeeded ? "Table" : "",
    event?.snackNeeded ? "Goûter" : "",
    event?.jerseyWashNeeded ? "Lavage maillots" : "",
  ].filter(Boolean);

  return {
    nextMatch: event ? new Date(event.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "À venir",
    playersToConfirm,
    carsAvailable,
    seatsAvailable,
    logisticsNeeds: needs.length,
    logisticsNeedsLabel: needs.join(" · ") || "Aucun besoin urgent",
    validatedMessagesCount,
    documentsCount,
  };
}

export function getLogisticsStatusLabel(status: PlayerLogisticsAvailability["status"]) {
  if (status === "present") return "Présent";
  if (status === "absent") return "Absent";
  if (status === "to_confirm") return "À confirmer";
  if (status === "unavailable") return "Non disponible";
  return "Non renseigné";
}

export function sanitizeParentReferentNote(note: string) {
  return note.replace(/médical|blessure|diagnostic|douleur/gi, "indisponible").slice(0, 160);
}
