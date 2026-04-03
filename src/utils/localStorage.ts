import type { BCVBSession } from "../types/session";

const CURRENT_SESSION_KEY = "bcvb.currentSession.v1";
const LIBRARY_KEY = "bcvb.library.v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function loadCurrentSessionFromLocal(): BCVBSession | null {
  return safeParse<BCVBSession | null>(localStorage.getItem(CURRENT_SESSION_KEY), null);
}

export function saveCurrentSessionToLocal(session: BCVBSession): void {
  localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
}

export function loadLibraryFromLocal(): BCVBSession[] {
  return safeParse<BCVBSession[]>(localStorage.getItem(LIBRARY_KEY), []);
}

export function saveLibraryToLocal(sessions: BCVBSession[]): void {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(sessions));
}

export function upsertSessionInLibrary(session: BCVBSession): BCVBSession[] {
  const current = loadLibraryFromLocal();
  const index = current.findIndex((item) => item.id === session.id);

  const next = [...current];
  if (index >= 0) {
    next[index] = session;
  } else {
    next.unshift(session);
  }

  saveLibraryToLocal(next);
  return next;
}

export function deleteSessionFromLibrary(sessionId: string): BCVBSession[] {
  const next = loadLibraryFromLocal().filter((item) => item.id !== sessionId);
  saveLibraryToLocal(next);
  return next;
}

export function downloadSessionJson(session: BCVBSession): void {
  const safeTitle = (session.title || "seance")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const blob = new Blob([JSON.stringify(session, null, 2)], {
    type: "application/json;charset=utf-8",
  });

  downloadBlob(blob, `${safeTitle || "seance"}.json`);
}

export async function loadSessionFromJsonFile(file: File): Promise<BCVBSession> {
  const text = await file.text();
  return JSON.parse(text) as BCVBSession;
}
