import type { EvaluationPermissionSet } from "../../types/evaluations";

export function canViewEvaluation(userRole?: string | null, _teamId?: string) {
  return ["admin", "coach", "team_staff", "dirigeant", "responsable_technique"].includes(userRole || "");
}

export function canEditEvaluation(userRole?: string | null, _teamId?: string) {
  return ["admin", "coach", "team_staff", "responsable_technique"].includes(userRole || "");
}

export function canDeleteEvaluation(userRole?: string | null) {
  return userRole === "admin";
}

export function canViewSensitiveCoachComments(userRole?: string | null) {
  return ["admin", "coach", "team_staff", "responsable_technique"].includes(userRole || "");
}

export function canExportEvaluation(userRole?: string | null) {
  return ["admin", "coach", "team_staff", "dirigeant", "responsable_technique"].includes(userRole || "");
}

export function canShareEvaluationWithFamily(userRole?: string | null) {
  return ["admin", "coach", "responsable_technique"].includes(userRole || "");
}

export function getEvaluationPermissions(userRole?: string | null, teamId?: string): EvaluationPermissionSet {
  return {
    canView: canViewEvaluation(userRole, teamId),
    canEdit: canEditEvaluation(userRole, teamId),
    canDelete: canDeleteEvaluation(userRole),
    canViewSensitiveCoachComments: canViewSensitiveCoachComments(userRole),
    canExport: canExportEvaluation(userRole),
    canShareWithFamily: canShareEvaluationWithFamily(userRole),
    aggregateOnly: userRole === "dirigeant",
  };
}
