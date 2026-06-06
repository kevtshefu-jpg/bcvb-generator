import type { TeamPermissionSet } from "../../types/teams";

type UserLike = { role?: string | null; id?: string | null } | string | null | undefined;

function roleOf(user: UserLike) {
  return typeof user === "string" ? user : user?.role || "";
}

export function canViewTeam(user: UserLike, _teamId?: string) {
  return ["admin", "coach", "team_staff", "dirigeant", "parent_referent", "responsable_technique"].includes(roleOf(user));
}

export function canEditTeam(user: UserLike, _teamId?: string) {
  return ["admin", "coach", "team_staff", "responsable_technique"].includes(roleOf(user));
}

export function canManageTeamStaff(user: UserLike, _teamId?: string) {
  return ["admin", "dirigeant", "responsable_technique"].includes(roleOf(user));
}

export function canManageStaff(user: UserLike, teamId?: string) {
  return canManageTeamStaff(user, teamId);
}

export function canManageTeamRoster(user: UserLike, _teamId?: string) {
  return ["admin", "coach", "team_staff", "responsable_technique"].includes(roleOf(user));
}

export function canManageTeamObjectives(user: UserLike, _teamId?: string) {
  return ["admin", "coach", "team_staff", "responsable_technique"].includes(roleOf(user));
}

export function canViewTeamEvaluations(user: UserLike, _teamId?: string) {
  return ["admin", "coach", "team_staff", "dirigeant", "responsable_technique"].includes(roleOf(user));
}

export function canExportTeam(user: UserLike, _teamId?: string) {
  return ["admin", "coach", "team_staff", "dirigeant", "responsable_technique"].includes(roleOf(user));
}

export function canArchiveTeam(user: UserLike, _teamId?: string) {
  return ["admin", "dirigeant", "responsable_technique"].includes(roleOf(user));
}

export function canDeleteTeam(user: UserLike, _teamId?: string) {
  return roleOf(user) === "admin";
}

export function getTeamPermissions(user: UserLike, teamId?: string): TeamPermissionSet {
  const role = roleOf(user);
  return {
    canView: canViewTeam(user, teamId),
    canEdit: canEditTeam(user, teamId),
    canManageStaff: canManageTeamStaff(user, teamId),
    canManageRoster: canManageTeamRoster(user, teamId),
    canManageObjectives: canManageTeamObjectives(user, teamId),
    canViewEvaluations: canViewTeamEvaluations(user, teamId),
    canExport: canExportTeam(user, teamId),
    canArchive: canArchiveTeam(user, teamId),
    canDelete: canDeleteTeam(user, teamId),
    canViewSensitiveTechnicalData: ["admin", "coach", "team_staff", "responsable_technique"].includes(role),
    readOnly: ["dirigeant", "parent_referent"].includes(role),
  };
}
