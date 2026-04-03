import { STORAGE_KEYS } from "../../../data/storageKeys";
import type { GeneratorState } from "../../../types/generator";

export type SavedSituationItem = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  state: GeneratorState;
};

export function readSavedSituations(): SavedSituationItem[] {
  const raw = localStorage.getItem(STORAGE_KEYS.SAVED_SITUATIONS);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as SavedSituationItem[];
  } catch {
    return [];
  }
}

export function writeSavedSituations(items: SavedSituationItem[]) {
  localStorage.setItem(STORAGE_KEYS.SAVED_SITUATIONS, JSON.stringify(items));
}

export function saveSituationToLibrary(state: GeneratorState): SavedSituationItem {
  const items = readSavedSituations();
  const now = new Date().toISOString();

  const newItem: SavedSituationItem = {
    id: `saved-${Math.random().toString(36).slice(2, 10)}`,
    createdAt: now,
    updatedAt: now,
    title: state.meta.title || "Situation sans titre",
    state
  };

  writeSavedSituations([newItem, ...items]);
  return newItem;
}

export function updateSavedSituation(itemId: string, state: GeneratorState): SavedSituationItem[] {
  const items = readSavedSituations().map((item) =>
    item.id === itemId
      ? {
          ...item,
          updatedAt: new Date().toISOString(),
          title: state.meta.title || item.title,
          state
        }
      : item
  );

  writeSavedSituations(items);
  return items;
}

export function deleteSavedSituation(itemId: string): SavedSituationItem[] {
  const items = readSavedSituations().filter((item) => item.id !== itemId);
  writeSavedSituations(items);
  return items;
}

export function duplicateSavedSituation(itemId: string): SavedSituationItem[] {
  const items = readSavedSituations();
  const source = items.find((item) => item.id === itemId);
  if (!source) return items;

  const now = new Date().toISOString();

  const clone: SavedSituationItem = {
    id: `saved-${Math.random().toString(36).slice(2, 10)}`,
    createdAt: now,
    updatedAt: now,
    title: `${source.title} (copie)`,
    state: {
      ...source.state,
      meta: {
        ...source.state.meta,
        title: `${source.state.meta.title} (copie)`
      }
    }
  };

  const next = [clone, ...items];
  writeSavedSituations(next);
  return next;
}
