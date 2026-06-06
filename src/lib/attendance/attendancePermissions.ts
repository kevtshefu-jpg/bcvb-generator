export type AttendanceRole =
  | "admin"
  | "responsable_technique"
  | "coach"
  | "team_staff"
  | "parent_referent"
  | "dirigeant"
  | "membre"
  | "member";

export function canViewAttendance(userRole?: string | null) {
  return ["admin", "responsable_technique", "coach", "team_staff", "dirigeant", "parent_referent"].includes(userRole || "");
}

export function canEditAttendance(userRole?: string | null, _teamId?: string) {
  return ["admin", "responsable_technique", "coach"].includes(userRole || "");
}

export function canValidateAttendance(userRole?: string | null) {
  return ["admin", "responsable_technique", "coach"].includes(userRole || "");
}

export function canViewAttendanceStats(userRole?: string | null) {
  return ["admin", "responsable_technique", "coach", "dirigeant"].includes(userRole || "");
}

export function canViewSensitiveAttendanceNotes(userRole?: string | null) {
  return ["admin", "responsable_technique", "coach"].includes(userRole || "");
}

export function canParentReferentConfirmLogistics(userRole?: string | null) {
  return ["admin", "parent_referent"].includes(userRole || "");
}

export function canParentReferentSignal(userRole?: string | null) {
  return userRole === "parent_referent";
}

export function canExportAttendance(userRole?: string | null) {
  return ["admin", "responsable_technique", "coach"].includes(userRole || "");
}
