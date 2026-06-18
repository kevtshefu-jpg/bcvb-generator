import type { QualityScore } from "../../document-quality/types/quality.types";
import type { DocumentVersion, DocumentVersionSnapshot, VersionDiffLine, VersionDiffSummary } from "../types/version.types";

const STORAGE_KEY = "bcvb:document-versions";

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `version-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

function readAllVersions(): DocumentVersion[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]") as DocumentVersion[];
    return parsed.map(normalizeVersion);
  } catch {
    return [];
  }
}

function writeAllVersions(versions: DocumentVersion[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
}

function hashContent(content: string) {
  let hash = 0;
  for (let index = 0; index < content.length; index += 1) {
    hash = (hash << 5) - hash + content.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function buildSnapshot(input: {
  title?: string;
  family?: string;
  content_source: string;
  content_rendered: string;
  savedReason?: string;
}): DocumentVersionSnapshot {
  return {
    title: input.title,
    family: input.family,
    sourceSize: input.content_source.length,
    renderedSize: input.content_rendered.length,
    sourceHash: hashContent(input.content_source),
    savedReason: input.savedReason ?? "Sauvegarde documentaire",
  };
}

function normalizeVersion(version: DocumentVersion): DocumentVersion {
  return {
    ...version,
    snapshot:
      version.snapshot ??
      buildSnapshot({
        content_source: version.content_source,
        content_rendered: version.content_rendered,
        savedReason: version.changeLog[0] ?? "Version migrée depuis le stockage local",
      }),
    isLatestVersion: version.isLatestVersion ?? false,
  };
}

export async function saveDocumentVersion(input: {
  documentId: string;
  title?: string;
  family?: string;
  content_source: string;
  content_rendered: string;
  parentId?: string;
  qualityScore?: QualityScore;
  changeLog?: string[];
  savedReason?: string;
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
    snapshot: buildSnapshot(input),
    isLatestVersion: true,
    changeLog: input.changeLog ?? [],
    createdAt: new Date().toISOString(),
    createdBy: "admin-local",
  };

  writeAllVersions([
    version,
    ...versions.map((item) =>
      item.documentId === input.documentId ? { ...item, isLatestVersion: false } : item
    ),
  ]);
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

export function downloadSource(documentId: string, contentSource?: string, fileNameSuffix?: string) {
  const source =
    contentSource ??
    readAllVersions().find((version) => version.documentId === documentId)?.content_source ??
    "";
  const url = URL.createObjectURL(new Blob([source], { type: "text/markdown;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${documentId || "document-bcvb"}${fileNameSuffix ? `-${fileNameSuffix}` : ""}.md`;
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

export function summarizeVersionDiff(diff: VersionDiffLine[]): VersionDiffSummary {
  return diff.reduce<VersionDiffSummary>(
    (summary, line) => ({
      ...summary,
      [line.type]: summary[line.type] + 1,
    }),
    { added: 0, removed: 0, changed: 0, same: 0 }
  );
}
