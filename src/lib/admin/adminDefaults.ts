import type { AdminPlatformConfig, ReferentialConfig, RolePermissionConfig } from "../../types/admin";
import { defaultDocumentStandards } from "./documentStandards";
import { defaultExportSettings } from "./exportSettings";
import { defaultSeasons } from "./seasonSettings";

export const defaultRolePermissions: RolePermissionConfig[] = [
  {
    role: "admin",
    label: "Administrateur",
    description: "Pilotage complet : documents, studio, qualité, OCR, imports, utilisateurs et réglages.",
    permissions: [
      "dashboard.view",
      "documents.view",
      "documents.create",
      "documents.edit",
      "documents.delete",
      "documents.publish",
      "documents.export",
      "studio.use",
      "studio.admin",
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
      "rosters.view",
      "rosters.import",
      "rosters.edit",
      "attendance.view",
      "attendance.edit",
      "evaluations.view",
      "evaluations.edit",
      "parents.view",
      "dirigeants.view",
      "faq.view",
      "tutorials.view",
      "ocr.use",
      "quality.view",
      "quality.run",
      "admin.settings",
    ],
  },
  {
    role: "responsable_technique",
    label: "Responsable technique",
    description: "Supervision sportive, référentiels, équipes, planifications et lecture qualité.",
    permissions: [
      "dashboard.view",
      "documents.view",
      "documents.edit",
      "documents.export",
      "sessions.view",
      "sessions.create",
      "sessions.edit.all",
      "sessions.export",
      "planning.view",
      "planning.create",
      "planning.edit.all",
      "rosters.view",
      "rosters.import",
      "rosters.edit",
      "attendance.view",
      "attendance.edit",
      "evaluations.view",
      "evaluations.edit",
      "dirigeants.view",
      "faq.view",
      "tutorials.view",
      "quality.view",
    ],
  },
  {
    role: "coach",
    label: "Coach",
    description: "Production terrain : séances, planifications, effectifs, présences et évaluations de ses équipes.",
    permissions: [
      "dashboard.view",
      "documents.view",
      "documents.export",
      "sessions.view",
      "sessions.create",
      "sessions.edit.own",
      "sessions.delete.own",
      "sessions.export",
      "planning.view",
      "planning.create",
      "planning.edit.own",
      "rosters.view",
      "rosters.import",
      "rosters.edit",
      "attendance.view",
      "attendance.edit",
      "evaluations.view",
      "evaluations.edit",
      "faq.view",
      "tutorials.view",
    ],
  },
  {
    role: "dirigeant",
    label: "Dirigeant",
    description: "Consultation des documents cadres, suivi équipes et éléments de pilotage.",
    permissions: [
      "dashboard.view",
      "documents.view",
      "documents.export",
      "planning.view",
      "rosters.view",
      "attendance.view",
      "evaluations.view",
      "dirigeants.view",
      "faq.view",
      "tutorials.view",
    ],
  },
  {
    role: "parent_referent",
    label: "Parent référent",
    description: "Logistique équipe, communication, événements et présences utiles.",
    permissions: [
      "dashboard.view",
      "documents.view",
      "planning.view",
      "attendance.view",
      "parents.view",
      "faq.view",
      "tutorials.view",
    ],
  },
  {
    role: "membre",
    label: "Membre",
    description: "Lecture des documents publics ou partagés, tutoriels et FAQ.",
    permissions: ["dashboard.view", "documents.view", "faq.view", "tutorials.view"],
  },
];

export const defaultReferentials: ReferentialConfig[] = [
  {
    key: "bcvb",
    label: "BCVB",
    description: "Identité club, vocabulaire, principes pédagogiques et standards documentaires.",
    enabled: true,
    injectInPrompt: true,
  },
  {
    key: "ffbb",
    label: "FFBB",
    description: "Cadres fédéraux, catégories, organisation sportive française.",
    enabled: true,
    injectInPrompt: true,
  },
  {
    key: "fiba",
    label: "FIBA",
    description: "Règles, terrain, standards internationaux et vocabulaire officiel.",
    enabled: true,
    injectInPrompt: true,
  },
  {
    key: "europe",
    label: "Europe",
    description: "Références de formation, intensité et culture tactique européenne.",
    enabled: true,
    injectInPrompt: false,
  },
  {
    key: "usa",
    label: "USA",
    description: "Approches skill development, spacing, lecture et culture entraînement.",
    enabled: false,
    injectInPrompt: false,
  },
  {
    key: "canada",
    label: "Canada",
    description: "Approches long term athlete development et formation progressive.",
    enabled: false,
    injectInPrompt: false,
  },
  {
    key: "specific_sources",
    label: "Sources spécifiques",
    description: "Documents joints, scans, OCR ou sources validées à injecter au cas par cas.",
    enabled: true,
    injectInPrompt: true,
  },
];

export const adminPlatformDefaults: AdminPlatformConfig = {
  roles: defaultRolePermissions,
  seasons: defaultSeasons,
  documentStandards: defaultDocumentStandards,
  referentials: defaultReferentials,
  exports: defaultExportSettings,
};

const STORAGE_KEY = "bcvb:admin-platform-config";

export function loadAdminPlatformConfig(): AdminPlatformConfig {
  if (typeof window === "undefined") return adminPlatformDefaults;

  try {
    const rawConfig = window.localStorage.getItem(STORAGE_KEY);
    if (!rawConfig) return adminPlatformDefaults;
    const parsed = JSON.parse(rawConfig) as Partial<AdminPlatformConfig>;

    return {
      roles: parsed.roles ?? adminPlatformDefaults.roles,
      seasons: parsed.seasons ?? adminPlatformDefaults.seasons,
      documentStandards: parsed.documentStandards ?? adminPlatformDefaults.documentStandards,
      referentials: parsed.referentials ?? adminPlatformDefaults.referentials,
      exports: parsed.exports ?? adminPlatformDefaults.exports,
    };
  } catch (error) {
    console.warn("Configuration admin illisible :", error);
    return adminPlatformDefaults;
  }
}

export function saveAdminPlatformConfig(config: AdminPlatformConfig) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
