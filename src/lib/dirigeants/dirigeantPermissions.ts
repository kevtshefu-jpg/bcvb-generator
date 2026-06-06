import type { AnnualPlanning } from "../../types/planning";

type UserLike = {
  id?: string;
  role?: string | null;
  validationEnabled?: boolean;
};

type TargetLike = {
  ownerId?: string;
  createdBy?: string;
  status?: string;
  validationEnabled?: boolean;
};

function roleOf(user?: UserLike | null) {
  return user?.role || "member";
}

export function canViewDirigeantDashboard(user?: UserLike | null) {
  return ["admin", "dirigeant", "responsable_technique"].includes(roleOf(user));
}

export function canViewPlanningReadOnly(user?: UserLike | null, planning?: AnnualPlanning | TargetLike | null) {
  const role = roleOf(user);
  if (role === "admin" || role === "dirigeant" || role === "responsable_technique") return true;
  if (role === "coach") return planning?.createdBy === user?.id || planning?.createdBy === user?.id || !planning?.createdBy;
  if (role === "parent_referent" || role === "team_staff") return planning?.status === "publié";
  return false;
}

export function canCommentPlanning(user?: UserLike | null, planning?: AnnualPlanning | TargetLike | null) {
  const role = roleOf(user);
  if (!canViewPlanningReadOnly(user, planning)) return false;
  return ["admin", "dirigeant", "responsable_technique", "coach"].includes(role);
}

export function canValidatePlanning(user?: UserLike | null, planning?: AnnualPlanning | TargetLike | null) {
  const role = roleOf(user);
  if (role === "admin") return true;
  if (role !== "dirigeant") return false;
  const planningValidationEnabled = Boolean(planning && "validationEnabled" in planning && planning.validationEnabled);
  return Boolean(user?.validationEnabled || planningValidationEnabled || planning?.status === "en validation dirigeant");
}

export function canRequestCorrection(user?: UserLike | null) {
  return ["admin", "dirigeant", "responsable_technique"].includes(roleOf(user));
}

export function canViewPublishedDocuments(user?: UserLike | null) {
  return ["admin", "dirigeant", "responsable_technique", "coach", "parent_referent", "team_staff", "member"].includes(roleOf(user));
}

export function canViewQualityPanel(user?: UserLike | null) {
  return ["admin", "dirigeant", "responsable_technique"].includes(roleOf(user));
}

export function canEditTechnicalContent(user?: UserLike | null) {
  return ["admin", "coach", "responsable_technique"].includes(roleOf(user));
}
