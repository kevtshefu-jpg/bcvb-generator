type UserLike = {
  role?: string | null;
  directorRole?: string | null;
};

const directorRoles = [
  "admin",
  "dirigeant",
  "responsable_technique",
  "president",
  "vice_president",
  "secretary",
  "treasurer",
  "sport_commission",
  "technical_manager",
  "director_readonly",
];

const validationRoles = ["admin", "president", "vice_president", "sport_commission", "technical_manager", "responsable_technique"];

function roleOf(user?: UserLike | string | null) {
  return typeof user === "string" ? user : user?.directorRole || user?.role || "member";
}

export function canViewDirectorSpace(user?: UserLike | string | null) {
  const role = roleOf(user);
  if (role === "parent_referent" || role === "team_staff") return false;
  return directorRoles.includes(role);
}

export const canViewDirectorDashboard = canViewDirectorSpace;

export function canViewDirectorDocuments(user?: UserLike | string | null) {
  return canViewDirectorSpace(user);
}

export function canViewDirectorPlanning(user?: UserLike | string | null) {
  return canViewDirectorSpace(user);
}

export function canViewDirectorOrganisation(user?: UserLike | string | null) {
  return canViewDirectorSpace(user);
}

export function canViewDirectorQuality(user?: UserLike | string | null) {
  return canViewDirectorSpace(user);
}

export function canValidateDocument(user?: UserLike | string | null) {
  return validationRoles.includes(roleOf(user));
}

export function canRequestCorrection(user?: UserLike | string | null) {
  return validationRoles.includes(roleOf(user));
}

export function canDownloadDirectorExport(user?: UserLike | string | null) {
  return canViewDirectorSpace(user);
}

export function canViewDirectorDocumentSource(user?: UserLike | string | null) {
  return roleOf(user) === "admin";
}
