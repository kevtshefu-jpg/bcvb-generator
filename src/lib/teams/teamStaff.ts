import type { TeamPermission, TeamStaffRole } from "../../types/teams";

export const defaultTeamStaffPermissions: Record<TeamStaffRole, TeamPermission[]> = {
  head_coach: ["view_team", "edit_team", "manage_roster", "create_sessions", "edit_sessions", "manage_attendance", "manage_evaluations", "export_team"],
  coach_principal: ["view_team", "edit_team", "manage_roster", "create_sessions", "edit_sessions", "manage_attendance", "manage_evaluations", "export_team"],
  assistant_coach: ["view_team", "create_sessions", "edit_sessions", "manage_attendance", "manage_evaluations"],
  aide_coach: ["view_team", "create_sessions", "manage_attendance"],
  physical_trainer: ["view_team", "create_sessions"],
  preparateur_physique: ["view_team", "create_sessions"],
  parent_referent: ["view_team"],
  dirigeant_referent: ["view_team", "export_team"],
  technical_manager: ["view_team", "edit_team", "manage_roster", "create_sessions", "edit_sessions", "manage_attendance", "manage_evaluations", "view_private_documents", "export_team"],
  responsable_technique: ["view_team", "edit_team", "manage_roster", "create_sessions", "edit_sessions", "manage_attendance", "manage_evaluations", "view_private_documents", "export_team"],
  otm_referent: ["view_team"],
  arbitre_referent: ["view_team"],
  autre: ["view_team"],
  other: ["view_team"],
};

export function getDefaultPermissionsForStaffRole(role: TeamStaffRole) {
  return defaultTeamStaffPermissions[role] || ["view_team"];
}

export function isHeadCoachRole(role: TeamStaffRole) {
  return role === "head_coach" || role === "coach_principal";
}

export function isTechnicalManagerRole(role: TeamStaffRole) {
  return role === "technical_manager" || role === "responsable_technique";
}
