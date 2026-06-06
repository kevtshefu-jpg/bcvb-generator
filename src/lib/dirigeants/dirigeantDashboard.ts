import type { DirigeantDashboardModel } from "../../types/dirigeants";
import {
  getDirigeantDocuments,
  getDirigeantOrganisation,
  getDirigeantPlanningSummaries,
  getDirigeantQualityAlerts,
} from "../planning/planningReadModels";

export function buildDirigeantDashboard(): DirigeantDashboardModel {
  const plannings = getDirigeantPlanningSummaries();
  const documents = getDirigeantDocuments();
  const organisation = getDirigeantOrganisation();
  const qualityAlerts = getDirigeantQualityAlerts();

  return {
    kpi: {
      activeTeams: organisation.length,
      validatedPlannings: plannings.filter((planning) => ["validé", "validée technique", "publié"].includes(planning.status)).length,
      planningsToValidate: plannings.filter((planning) => planning.validationStatus === "ready_for_validation" || planning.validationStatus === "in_dirigeant_validation").length,
      teamsWithoutPlanning: organisation.filter((team) => !plannings.some((planning) => planning.teamId === team.teamId)).length,
      publishedDocuments: documents.filter((document) => document.status === "published").length,
      documentsToCorrect: documents.filter((document) => document.status === "to_correct").length,
      missingAttendances: organisation.filter((team) => team.notes.includes("Présences")).length,
      missingEvaluations: organisation.filter((team) => team.notes.includes("Évaluation")).length,
      qualityAlerts: qualityAlerts.length,
    },
    plannings,
    documents,
    organisation,
    qualityAlerts,
  };
}
