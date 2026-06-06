import type { PermissionKey, RolePermissionConfig, UserRole } from "../../types/admin";

export const permissionLabels: Record<PermissionKey, string> = {
  "dashboard.view": "Voir tableau de bord",
  "documents.view": "Voir documents",
  "documents.create": "Créer documents",
  "documents.edit": "Modifier documents",
  "documents.delete": "Supprimer documents",
  "documents.publish": "Publier documents",
  "documents.export": "Exporter documents",
  "studio.use": "Utiliser studio",
  "studio.admin": "Administrer studio",
  "sessions.view": "Voir séances",
  "sessions.create": "Créer séances",
  "sessions.edit.own": "Modifier ses séances",
  "sessions.edit.all": "Modifier toutes séances",
  "sessions.delete.own": "Supprimer ses séances",
  "sessions.delete.all": "Supprimer toutes séances",
  "sessions.export": "Exporter séances",
  "planning.view": "Voir planifications",
  "planning.create": "Créer planifications",
  "planning.edit.own": "Modifier ses planifications",
  "planning.edit.all": "Modifier toutes planifications",
  "rosters.view": "Voir effectifs",
  "rosters.import": "Importer effectifs",
  "rosters.edit": "Modifier effectifs",
  "attendance.view": "Voir présences",
  "attendance.edit": "Modifier présences",
  "evaluations.view": "Voir évaluations",
  "evaluations.edit": "Modifier évaluations",
  "parents.view": "Voir espace parents référents",
  "dirigeants.view": "Voir espace dirigeants",
  "faq.view": "Voir FAQ",
  "tutorials.view": "Voir tutoriels",
  "ocr.use": "Utiliser OCR",
  "quality.view": "Voir qualité documentaire",
  "quality.run": "Lancer contrôle qualité",
  "admin.settings": "Gérer administration",
};

export const permissionGroups: Array<{ label: string; permissions: PermissionKey[] }> = [
  {
    label: "Socle",
    permissions: ["dashboard.view", "faq.view", "tutorials.view"],
  },
  {
    label: "Documents",
    permissions: [
      "documents.view",
      "documents.create",
      "documents.edit",
      "documents.delete",
      "documents.publish",
      "documents.export",
    ],
  },
  {
    label: "Studio & qualité",
    permissions: ["studio.use", "studio.admin", "ocr.use", "quality.view", "quality.run"],
  },
  {
    label: "Terrain",
    permissions: [
      "sessions.view",
      "sessions.create",
      "sessions.edit.own",
      "sessions.edit.all",
      "sessions.delete.own",
      "sessions.delete.all",
      "sessions.export",
      "planning.view",
      "planning.create",
      "planning.edit.own",
      "planning.edit.all",
    ],
  },
  {
    label: "Joueurs & équipes",
    permissions: [
      "rosters.view",
      "rosters.import",
      "rosters.edit",
      "attendance.view",
      "attendance.edit",
      "evaluations.view",
      "evaluations.edit",
    ],
  },
  {
    label: "Espaces dédiés",
    permissions: ["parents.view", "dirigeants.view", "admin.settings"],
  },
];

export function hasAdminPermission(roleConfig: RolePermissionConfig, permission: PermissionKey) {
  return roleConfig.permissions.includes(permission);
}

export function togglePermission(
  roleConfig: RolePermissionConfig,
  permission: PermissionKey,
  enabled: boolean
): RolePermissionConfig {
  if (enabled && roleConfig.permissions.includes(permission)) return roleConfig;
  if (!enabled && !roleConfig.permissions.includes(permission)) return roleConfig;

  return {
    ...roleConfig,
    permissions: enabled
      ? [...roleConfig.permissions, permission]
      : roleConfig.permissions.filter((item) => item !== permission),
  };
}

export function canRoleUseAdminOnlyFeatures(role: UserRole) {
  return role === "admin";
}

export function enforceAdminGuardrails(config: RolePermissionConfig[]) {
  const adminOnlyPermissions: PermissionKey[] = [
    "documents.create",
    "documents.delete",
    "documents.publish",
    "studio.use",
    "studio.admin",
    "ocr.use",
    "quality.run",
    "admin.settings",
  ];

  return config.map((roleConfig) => {
    if (roleConfig.role === "admin") return roleConfig;

    return {
      ...roleConfig,
      permissions: roleConfig.permissions.filter((permission) => !adminOnlyPermissions.includes(permission)),
    };
  });
}
