import type { QualityScore } from "../../document-quality/types/quality.types";

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  parentId?: string;
  content_source: string;
  content_rendered: string;
  qualityScore?: QualityScore;
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
