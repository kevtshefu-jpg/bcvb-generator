export type FaqRole =
  | "admin"
  | "responsable_technique"
  | "coach"
  | "dirigeant"
  | "parent_referent"
  | "membre"
  | "tous";

export type FaqCategory =
  | "acces"
  | "documents"
  | "studio_editorial"
  | "seances"
  | "effectifs"
  | "presences"
  | "evaluations"
  | "exports"
  | "ocr"
  | "sauvegarde"
  | "bibliotheque"
  | "problemes";

export type FaqPriority = "haute" | "moyenne" | "basse";

export interface FaqItem {
  id: string;
  question: string;
  shortAnswer: string;
  answer: string;
  category: FaqCategory;
  roles: FaqRole[];
  priority: FaqPriority;
  tags: string[];
  relatedRoutes: string[];
  relatedTutorialIds: string[];
  relatedErrorCodes?: string[];
}

export interface FaqContextHint {
  id: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  errorCode?: string;
  relatedFaqIds: string[];
}
