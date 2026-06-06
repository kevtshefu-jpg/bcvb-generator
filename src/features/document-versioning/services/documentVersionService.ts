import type { QualityScore } from "../../document-quality/types/quality.types";
import type { DocumentVersion, VersionDiffLine } from "../types/version.types";

const STORAGE_KEY = "bcvb:document-versions";

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `version-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

function readAllVersions(): DocumentVersion[] {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]") as DocumentVersion[];
  } catch {
    return [];
  }
}

function writeAllVersions(versions: DocumentVersion[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
}

export async function saveDocumentVersion(input: {
  documentId: string;
  content_source: string;
  content_rendered: string;
  parentId?: string;
  qualityScore?: QualityScore;
  changeLog?: string[];
}): Promise<DocumentVersion> {
  const versions = readAllVersions();
  const documentVersions = versions.filter((version) => version.documentId === input.documentId);
  const nextVersionNumber = Math.max(0, ...documentVersions.map((version) => version.version)) + 1;
  const version: DocumentVersion = {
    id: createId(),
    documentId: input.documentId,
    version: nextVersionNumber,
    parentId: input.parentId,
    content_source: input.content_source,
    content_rendered: input.content_rendered,
    qualityScore: input.qualityScore,
    changeLog: input.changeLog ?? [],
    createdAt: new Date().toISOString(),
    createdBy: "admin-local",
  };

  writeAllVersions([version, ...versions]);
  return version;
}

export async function getVersionHistory(documentId: string): Promise<DocumentVersion[]> {
  return readAllVersions()
    .filter((version) => version.documentId === documentId)
    .sort((a, b) => b.version - a.version);
}

export async function restoreVersion(versionId: string): Promise<DocumentVersion | null> {
  return readAllVersions().find((version) => version.id === versionId) ?? null;
}

export function downloadSource(documentId: string, contentSource?: string) {
  const source =
    contentSource ??
    readAllVersions().find((version) => version.documentId === documentId)?.content_source ??
    "";
  const url = URL.createObjectURL(new Blob([source], { type: "text/markdown;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${documentId || "document-bcvb"}.md`;
  link.click();
  URL.revokeObjectURL(url);
}

export function compareVersions(versionA: DocumentVersion, versionB: DocumentVersion): VersionDiffLine[] {
  const beforeLines = versionA.content_source.split("\n");
  const afterLines = versionB.content_source.split("\n");
  const maxLength = Math.max(beforeLines.length, afterLines.length);

  return Array.from({ length: maxLength }, (_, index) => {
    const before = beforeLines[index] ?? "";
    const after = afterLines[index] ?? "";
    return {
      lineNumber: index + 1,
      before,
      after,
      type: before === after ? "same" : before && !after ? "removed" : !before && after ? "added" : "changed",
    };
  });
}
