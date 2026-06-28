import type { FaqContextHint } from "../../types/faq";

export const faqErrorContexts: Record<string, FaqContextHint> = {
  AUTH_FORBIDDEN: {
    id: "auth-forbidden",
    title: "Accès refusé",
    description: "Le rôle connecté ne possède pas le droit nécessaire pour cette action ou cette rubrique.",
    severity: "warning",
    errorCode: "AUTH_FORBIDDEN",
    relatedFaqIds: ["qui-peut-creer-modifier-telecharger", "pourquoi-module-invisible"],
  },
  QUALITY_SCORE_BLOCKED: {
    id: "quality-score-blocked",
    title: "Score qualité bloquant",
    description: "Le document doit être corrigé avant publication ou export final.",
    severity: "critical",
    errorCode: "QUALITY_SCORE_BLOCKED",
    relatedFaqIds: ["score-qualite-bloque", "document-non-publiable"],
  },
  EXPORT_FAILED: {
    id: "export-failed",
    title: "Export impossible",
    description: "La source, le PDF, le rendu terrain ou les droits doivent être vérifiés.",
    severity: "warning",
    errorCode: "EXPORT_FAILED",
    relatedFaqIds: ["export-ne-fonctionne-pas", "telecharger-document"],
  },
  IMPORT_VALIDATION_FAILED: {
    id: "import-validation-failed",
    title: "Import à corriger",
    description: "Le fichier contient des colonnes manquantes, doublons ou lignes invalides.",
    severity: "warning",
    errorCode: "IMPORT_VALIDATION_FAILED",
    relatedFaqIds: ["corriger-erreur-import", "importer-effectif-format"],
  },
  COURT_RENDER_EMPTY: {
    id: "court-render-empty",
    title: "Terrain ou schéma invisible",
    description: "Le SVG terrain, les objets ou le layout doivent être contrôlés avant export.",
    severity: "warning",
    errorCode: "COURT_RENDER_EMPTY",
    relatedFaqIds: ["terrain-schema-invisible", "export-ne-fonctionne-pas"],
  },
  DRAFT_RESTORE_AVAILABLE: {
    id: "draft-restore-available",
    title: "Brouillon disponible",
    description: "Un travail sauvegardé peut être repris depuis le tableau de bord ou le module d’origine.",
    severity: "info",
    errorCode: "DRAFT_RESTORE_AVAILABLE",
    relatedFaqIds: ["recuperer-brouillon", "travail-perdu"],
  },
};

const routeContexts: Array<{ match: string; context: FaqContextHint }> = [
  {
    match: "/admin/studio-editorial",
    context: {
      id: "route-studio-editorial",
      title: "Aide Studio éditorial",
      description: "Questions utiles pour créer, transformer, contrôler et exporter un document BCVB.",
      severity: "info",
      relatedFaqIds: ["document-non-publiable", "score-qualite-bloque", "studio-documentaire-production"],
    },
  },
  {
    match: "/coach/seances",
    context: {
      id: "route-seances",
      title: "Aide Créateur de séances",
      description: "Questions utiles pour les fiches séance, terrains, schémas et exports coach.",
      severity: "info",
      relatedFaqIds: ["creer-seance", "terrain-schema-invisible", "export-ne-fonctionne-pas"],
    },
  },
  {
    match: "/effectifs",
    context: {
      id: "route-effectifs",
      title: "Aide Import effectifs",
      description: "Questions utiles pour les fichiers CSV/Excel, mapping, doublons et affectations.",
      severity: "info",
      relatedFaqIds: ["importer-effectif-format", "corriger-erreur-import"],
    },
  },
  {
    match: "/bibliotheque",
    context: {
      id: "route-bibliotheque",
      title: "Aide Bibliothèque",
      description: "Questions utiles pour retrouver, ouvrir, télécharger ou transformer un document.",
      severity: "info",
      relatedFaqIds: ["bibliotheque-document-invisible", "telecharger-document", "transformer-document-bcvb"],
    },
  },
];

export function getFaqContextByError(errorCode?: string | null) {
  if (!errorCode) return null;
  return faqErrorContexts[errorCode] ?? null;
}

export function getFaqContextFromPath(pathname: string) {
  return routeContexts.find((entry) => pathname.startsWith(entry.match))?.context ?? null;
}
