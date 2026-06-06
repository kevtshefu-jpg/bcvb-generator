import type { RosterPermissionSet } from "../../types/roster";

export type RosterRole =
  | "admin"
  | "responsable_technique"
  | "coach"
  | "team_staff"
  | "parent_referent"
  | "dirigeant"
  | "member"
  | "membre";

export function getRosterPermissions(role?: string | null): RosterPermissionSet {
  const normalized = role || "member";
  const admin = normalized === "admin";
  const technicalManager = normalized === "responsable_technique" || normalized === "team_staff";
  const coach = normalized === "coach";
  const parentReferent = normalized === "parent_referent";
  const leader = normalized === "dirigeant";

  return {
    canImport: admin || technicalManager || coach,
    canValidateImport: admin || technicalManager,
    canMergeDuplicates: admin,
    canAssignTeams: admin || technicalManager || coach,
    canCreateTeam: admin || technicalManager,
    canExport: admin || technicalManager || coach || leader,
    canDeletePlayer: admin,
    canArchivePlayer: admin || technicalManager,
    canViewSensitiveContacts: admin || technicalManager || coach || parentReferent,
    readOnly: leader || parentReferent || normalized === "member" || normalized === "membre",
  };
}

export function canImportRoster(role?: string | null) {
  return getRosterPermissions(role).canImport;
}

export function canAssignRosterTeams(role?: string | null) {
  return getRosterPermissions(role).canAssignTeams;
}

export function canManageRosterDuplicates(role?: string | null) {
  return getRosterPermissions(role).canMergeDuplicates;
}

export function canViewRosterContacts(role?: string | null) {
  return getRosterPermissions(role).canViewSensitiveContacts;
}

export function canExportRoster(role?: string | null) {
  return getRosterPermissions(role).canExport;
}
