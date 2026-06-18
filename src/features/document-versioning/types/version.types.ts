import type { QualityScore } from "../../document-quality/types/quality.types";

export interface DocumentVersionSnapshot {
  title?: string;
  family?: string;
  sourceSize: number;
  renderedSize: number;
  sourceHash: string;
  savedReason: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  parentId?: string;
  content_source: string;
  content_rendered: string;
  qualityScore?: QualityScore;
  snapshot: DocumentVersionSnapshot;
  isLatestVersion: boolean;
  changeLog: string[];
  createdAt: string;
  createdBy?: string;
}

export interface VersionDiffLine {
  lineNumber: number;
  before: string;
  after: string;
  type: "same" | "added" | "removed" | "changed";
}

export interface VersionDiffSummary {
  added: number;
  removed: number;
  changed: number;
  same: number;
}
