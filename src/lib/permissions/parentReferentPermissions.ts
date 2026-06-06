import type { ParentReferentDocument, ParentReferentMessageTemplate } from "../../types/parentReferent";

type UserLike = {
  id?: string;
  role?: string | null;
  teamIds?: string[];
  authorizedTeamIds?: string[];
};

function roleOf(user?: UserLike | string | null) {
  return typeof user === "string" ? user : user?.role || "member";
}

function isParentReferent(user?: UserLike | string | null) {
  return roleOf(user) === "parent_referent";
}

function isClubStaff(user?: UserLike | string | null) {
  return ["admin", "responsable_technique", "coach", "team_staff"].includes(roleOf(user));
}

function hasTeamAccess(user: UserLike | string | null | undefined, teamId?: string) {
  if (!teamId || typeof user === "string" || !user) return true;
  const teamIds = [...(user.teamIds || []), ...(user.authorizedTeamIds || [])];
  return teamIds.length === 0 || teamIds.includes(teamId);
}

export function canViewParentReferentSpace(user?: UserLike | string | null) {
  return ["admin", "responsable_technique", "coach", "team_staff", "parent_referent"].includes(roleOf(user));
}

export const canViewParentReferentArea = canViewParentReferentSpace;

export function canViewTeamLogistics(user?: UserLike | string | null, teamId?: string) {
  return canViewParentReferentSpace(user) && hasTeamAccess(user, teamId);
}

export function canManageLogisticsAvailability(user?: UserLike | string | null, teamId?: string) {
  return ["admin", "team_staff", "parent_referent"].includes(roleOf(user)) && hasTeamAccess(user, teamId);
}

export function canViewParentDocuments(user?: UserLike | string | null) {
  return canViewParentReferentSpace(user);
}

export function canViewParentUsefulDocuments(user: UserLike | string | null | undefined, document?: ParentReferentDocument | null) {
  if (!canViewParentDocuments(user) || !document) return false;
  if (document.status !== "published") return false;
  return ["parent_referents", "parents", "families", "public"].includes(document.audience);
}

export function canProposeParentMessage(user?: UserLike | string | null, teamId?: string) {
  return ["admin", "coach", "team_staff", "parent_referent"].includes(roleOf(user)) && hasTeamAccess(user, teamId);
}

export const canPrepareParentMessage = canProposeParentMessage;
export const canSubmitMessageToCoach = canProposeParentMessage;

export function canCopyValidatedMessage(user: UserLike | string | null | undefined, message: ParentReferentMessageTemplate) {
  return canViewParentReferentSpace(user) && ["validated_by_coach", "coach_validated", "club_validated"].includes(message.status);
}

export function canViewLogisticAvailability(user?: UserLike | string | null, _eventId?: string) {
  return canViewParentReferentSpace(user);
}

export function canEditLogisticAvailability(user?: UserLike | string | null, _eventId?: string) {
  return ["admin", "team_staff", "parent_referent"].includes(roleOf(user));
}

export function canViewSensitivePlayerData(user?: UserLike | string | null) {
  if (isParentReferent(user)) return false;
  return isClubStaff(user);
}

export function canViewPlayerEvaluations(user?: UserLike | string | null) {
  if (isParentReferent(user)) return false;
  return ["admin", "responsable_technique", "coach"].includes(roleOf(user));
}

export function canViewInternalCoachComments(user?: UserLike | string | null) {
  if (isParentReferent(user)) return false;
  return ["admin", "responsable_technique", "coach"].includes(roleOf(user));
}

export const canViewCoachPrivateNotes = canViewInternalCoachComments;

export function canEditPlanning(user?: UserLike | string | null) {
  if (isParentReferent(user)) return false;
  return ["admin", "responsable_technique", "coach"].includes(roleOf(user));
}

export function canEditSession(user?: UserLike | string | null) {
  if (isParentReferent(user)) return false;
  return ["admin", "responsable_technique", "coach"].includes(roleOf(user));
}

export function canAccessEditorialStudio(user?: UserLike | string | null) {
  if (isParentReferent(user)) return false;
  return roleOf(user) === "admin";
}
