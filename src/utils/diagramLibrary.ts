import type { BCVBDiagramSnapshot } from "../diagram/fibaOverlaySvg";

const STORAGE_KEY = "bcvb.diagram.library.v1";

export function loadDiagramLibrary(): BCVBDiagramSnapshot[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			return [];
		}

		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? (parsed as BCVBDiagramSnapshot[]) : [];
	} catch {
		return [];
	}
}

function saveDiagramLibrary(items: BCVBDiagramSnapshot[]) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function upsertDiagramLibraryItem(item: BCVBDiagramSnapshot): void {
	const items = loadDiagramLibrary();
	const next = [item, ...items.filter((existing) => existing.id !== item.id)];
	saveDiagramLibrary(next);
}

export function deleteDiagramLibraryItem(id: string): void {
	const items = loadDiagramLibrary().filter((item) => item.id !== id);
	saveDiagramLibrary(items);
}

export function exportDiagramJson(item: BCVBDiagramSnapshot): void {
	const blob = new Blob([JSON.stringify(item, null, 2)], {
		type: "application/json;charset=utf-8",
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `${item.id || "diagramme-bcvb"}.json`;
	link.click();
	URL.revokeObjectURL(url);
}

export async function importDiagramJson(file: File): Promise<BCVBDiagramSnapshot> {
	const text = await file.text();
	const parsed = JSON.parse(text) as Partial<BCVBDiagramSnapshot>;

	return {
		id: parsed.id || `diagram-${Date.now()}`,
		title: parsed.title || "Diagramme BCVB",
		category: parsed.category || "",
		theme: parsed.theme || "",
		createdAt: parsed.createdAt || new Date().toISOString(),
		updatedAt: parsed.updatedAt || new Date().toISOString(),
		elements: parsed.elements || [],
		actions: parsed.actions || [],
	};
}
