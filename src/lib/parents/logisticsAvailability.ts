import type { PlayerLogisticsAvailability, TeamLogisticsEvent } from "../../types/parentReferent";
import { computeParentReferentKpis } from "../parentReferents/parentReferentLogistics";

const STORAGE_KEY = "bcvb.parent.logistics.availability";

export function loadParentLogisticAvailability(fallback: PlayerLogisticsAvailability[]) {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) as PlayerLogisticsAvailability[] : fallback;
}

export function saveParentLogisticAvailability(items: PlayerLogisticsAvailability[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function buildParentLogisticsSummary(event: TeamLogisticsEvent | undefined, items: PlayerLogisticsAvailability[]) {
  const kpis = computeParentReferentKpis(event, items, 0, 0);
  return {
    eventTitle: event?.title || "Événement à confirmer",
    eventDate: event?.date || "",
    playersToConfirm: kpis.playersToConfirm,
    carsAvailable: kpis.carsAvailable,
    seatsAvailable: kpis.seatsAvailable,
    logisticsNeedsLabel: kpis.logisticsNeedsLabel,
  };
}
