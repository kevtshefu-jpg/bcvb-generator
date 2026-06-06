import type {
  DirectorDashboardIndicator,
  DirectorDocumentStatus,
  DirectorDocumentView,
  DirectorPlanningOverview,
  DirectorSpaceBlock,
  DirectorSpaceModel,
  DirectorTeamOverview,
} from "../../types/directors";
import { buildDirigeantDashboard } from "../dirigeants/dirigeantDashboard";
import { getDirigeantDocuments, getDirigeantPlanningSummaries } from "../planning/planningReadModels";
import { getTeamDocuments, getTeamObjectives, getTeamStaff, teamProfiles } from "../teams/teamProfiles";
import { computeTeamIndicators } from "../teams/teamStats";
import { canValidateDocument, canViewDirectorDocumentSource } from "./directorPermissions";

function mapDocumentStatus(status: string): DirectorDocumentStatus {
  if (status === "published" || status === "validated") return "published";
  if (status === "to_correct") return "to_correct";
  if (status === "archived") return "archived";
  if (status === "draft") return "not_publishable";
  return "pending_validation";
}

function mapPlanningStatus(status: string): DirectorPlanningOverview["status"] {
  if (status === "publié" || status === "published") return "published";
  if (status === "validé" || status === "validée technique" || status === "validated") return "validated";
  if (status === "archivé" || status === "archived") return "archived";
  if (status === "brouillon" || status === "proposée") return "draft";
  return "draft";
}

function statusForValue(value: number, warningAt: number, criticalAt: number): DirectorDashboardIndicator["status"] {
  if (value >= criticalAt) return "critical";
  if (value >= warningAt) return "warning";
  return "ok";
}

export function getDirectorTeamOverviews(): DirectorTeamOverview[] {
  return teamProfiles.map((team) => {
    const staff = getTeamStaff(team.id);
    const objectives = getTeamObjectives(team.id);
    const documents = getTeamDocuments(team.id);
    const indicators = computeTeamIndicators(team, staff, objectives, documents);
    const hasPlanning = documents.some((document) => document.documentType === "planning");
    const planningStatus: DirectorTeamOverview["planningStatus"] = hasPlanning
      ? team.id === "u13m1" ? "published" : "validated"
      : "missing";
    const targetPlayersCount = team.category === "U13" ? 14 : team.category === "U15" ? 12 : 14;

    return {
      id: team.id,
      name: team.name,
      category: team.category,
      level: team.level,
      season: team.season,
      headCoach: staff.find((member) => member.role === "head_coach" && member.isActive)?.name,
      assistantCoach: staff.find((member) => member.role === "assistant_coach" && member.isActive)?.name,
      parentReferent: staff.find((member) => member.role === "parent_referent" && member.isActive)?.name,
      directorReferent: staff.find((member) => member.role === "dirigeant_referent" && member.isActive)?.name || "À nommer",
      playersCount: indicators.playersCount,
      targetPlayersCount,
      planningStatus,
      presenceStatus: documents.some((document) => document.documentType === "presence") ? "up_to_date" : "missing",
      evaluationStatus: documents.some((document) => document.documentType === "evaluation") ? "up_to_date" : "missing",
      alerts: [
        ...indicators.alerts,
        indicators.playersCount > targetPlayersCount + 2 ? "Sureffectif à arbitrer." : "",
        indicators.playersCount < targetPlayersCount - 2 ? "Sous-effectif à surveiller." : "",
      ].filter(Boolean),
    };
  });
}

export function getDirectorDocuments(user?: { role?: string | null } | string | null): DirectorDocumentView[] {
  return getDirigeantDocuments()
    .map((document): DirectorDocumentView => ({
      id: document.id,
      title: document.title,
      family: document.family,
      category: document.category,
      season: "2026-2027",
      status: mapDocumentStatus(document.status),
      qualityScore: document.qualityScore,
      publishedAt: document.status === "published" ? document.updatedAt : undefined,
      updatedAt: document.updatedAt,
      validatedBy: document.status === "published" ? "Commission sportive" : undefined,
      canDownloadPdf: ["published", "pending_validation"].includes(mapDocumentStatus(document.status)),
      canViewSource: canViewDirectorDocumentSource(user),
      canValidate: canValidateDocument(user) && ["pending_validation", "to_correct"].includes(mapDocumentStatus(document.status)),
    }))
    .filter((document) => document.status !== "not_publishable");
}

export function getDirectorPlanningOverviews(): DirectorPlanningOverview[] {
  return getDirigeantPlanningSummaries().map((planning) => ({
    id: planning.id,
    teamId: planning.teamId,
    teamName: planning.teamName,
    category: String(planning.category),
    season: planning.season,
    status: mapPlanningStatus(planning.status),
    currentCycle: planning.currentCycle,
    objectivesCount: planning.mainObjectives.length,
    linkedSessionsCount: planning.linkedSessionsCount,
    completionRate: planning.realizationRate,
  }));
}

function buildIndicators(model: {
  teams: DirectorTeamOverview[];
  documents: DirectorDocumentView[];
  plannings: DirectorPlanningOverview[];
}): DirectorDashboardIndicator[] {
  const activeTeams = model.teams.length;
  const documentsToValidate = model.documents.filter((document) => document.status === "pending_validation").length;
  const teamsWithoutPlanning = model.teams.filter((team) => team.planningStatus === "missing").length;
  const qualityScores = model.documents.map((document) => document.qualityScore || 0).filter(Boolean);
  const averageQuality = qualityScores.length ? Math.round(qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length) : 0;
  const sportAlerts = model.teams.reduce((sum, team) => sum + team.alerts.length, 0);

  return [
    { id: "active-teams", label: "Équipes actives", value: activeTeams, status: "info", description: "Groupes suivis cette saison.", actionLabel: "Voir équipes", actionTarget: "/club/equipes" },
    { id: "published-documents", label: "Documents publiés", value: model.documents.filter((document) => document.status === "published").length, status: "ok", description: "Documents officiels accessibles." },
    { id: "documents-to-validate", label: "Documents à valider", value: documentsToValidate, status: statusForValue(documentsToValidate, 1, 3), description: "Attente commission ou bureau." },
    { id: "validated-plannings", label: "Planifications validées", value: model.plannings.filter((planning) => planning.status === "validated" || planning.status === "published").length, status: "ok", description: "Plans consultables en lecture." },
    { id: "sport-alerts", label: "Alertes sportives", value: sportAlerts, status: statusForValue(sportAlerts, 3, 6), description: "Équipes, présences, évaluations." },
    { id: "average-quality", label: "Qualité documentaire moyenne", value: `${averageQuality}/100`, status: averageQuality >= 80 ? "ok" : averageQuality >= 70 ? "warning" : "critical", description: "Score moyen des documents suivis." },
    { id: "teams-without-planning", label: "Équipes sans planification", value: teamsWithoutPlanning, status: statusForValue(teamsWithoutPlanning, 1, 2), description: "Plans à créer ou finaliser." },
  ];
}

function block(
  id: string,
  title: string,
  whyFor: string,
  why: string,
  quickAccess: string,
  indicators: DirectorDashboardIndicator[],
  status: DirectorSpaceBlock["status"],
  recommendedAction: string
): DirectorSpaceBlock {
  return { id, title, whyFor, why, quickAccess, indicators, status, recommendedAction };
}

export function buildDirectorSpaceModel(user?: { role?: string | null } | string | null): DirectorSpaceModel {
  const teams = getDirectorTeamOverviews();
  const documents = getDirectorDocuments(user);
  const plannings = getDirectorPlanningOverviews();
  const indicators = buildIndicators({ teams, documents, plannings });
  const legacy = buildDirigeantDashboard();

  return {
    indicators,
    teams,
    documents,
    plannings,
    qualityComments: legacy.plannings.flatMap((planning) => planning.comments.map((comment) => ({
      id: comment.id,
      author: comment.authorName,
      target: planning.teamName,
      comment: comment.content,
      createdAt: comment.createdAt,
    }))),
    blocks: [
      block("sport", "Pilotage sportif", "Voir l’état des équipes et documents.", "Aider la commission sportive à décider.", "/club/equipes", indicators.filter((item) => ["active-teams", "sport-alerts", "teams-without-planning"].includes(item.id)), "Prioritaire", "Traiter les alertes équipes avant la prochaine commission."),
      block("documents", "Documents club", "Accéder aux documents validés.", "Garantir une information unique et officielle.", "/documents-club", indicators.filter((item) => ["published-documents", "documents-to-validate", "average-quality"].includes(item.id)), "À valider", "Valider ou demander correction sur les documents en attente."),
      block("planning", "Suivi planifications", "Consulter les plans sans les modifier.", "Avoir une vision de formation club.", "/club/planifications", indicators.filter((item) => ["validated-plannings", "teams-without-planning", "sport-alerts"].includes(item.id)), "À suivre", "Exporter une synthèse des plans par catégorie."),
      block("organisation", "Organisation", "Voir informations équipes et logistique.", "Connecter sportif et organisationnel.", "/club/equipes", indicators.filter((item) => ["active-teams", "teams-without-planning", "sport-alerts"].includes(item.id)), "Stable", "Nommer les référents manquants et suivre les effectifs."),
      block("quality", "Qualité documentaire", "Voir les documents publiables ou à corriger.", "Sécuriser l’image du club.", "#directors-quality", indicators.filter((item) => ["average-quality", "documents-to-validate", "published-documents"].includes(item.id)), "À suivre", "Demander correction sur les documents sous seuil."),
    ],
  };
}
