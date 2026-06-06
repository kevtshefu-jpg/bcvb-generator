import type {
  TeamDashboardData,
  TeamIndicators,
  TeamLinkedDocument,
  TeamObjective,
  TeamProfile,
  TeamStats,
  TeamStaffMember,
} from "../../types/teams";
import { getTeamDocuments, getTeamObjectives, getTeamProfile, getTeamStaff } from "./teamProfiles";
import { isHeadCoachRole } from "./teamStaff";

export function computeTeamIndicators(
  team: TeamProfile,
  staff: TeamStaffMember[],
  objectives: TeamObjective[],
  documents: TeamLinkedDocument[]
): TeamIndicators {
  const reachedObjectives = objectives.filter((objective) => objective.status === "atteint").length;
  const inProgressObjectives = objectives.filter((objective) => objective.status === "en_cours").length;
  const hasPlanning = documents.some((document) => document.documentType === "planning");
  const hasAttendance = documents.some((document) => document.documentType === "presence");
  const hasEvaluations = documents.some((document) => document.documentType === "evaluation");
  const alerts: string[] = [];

  if (!staff.some((member) => isHeadCoachRole(member.role) && member.isActive)) alerts.push("Coach principal à affecter.");
  if (objectives.length === 0) alerts.push("Objectifs saison à définir.");
  if (!hasPlanning) alerts.push("Planification active manquante.");
  if (!hasAttendance) alerts.push("Présences récentes non remplies.");
  if (!hasEvaluations) alerts.push("Évaluation récente à produire.");
  if (team.status === "archived" || team.status === "archive") alerts.push("Équipe archivée.");

  return {
    playersCount: team.id === "u13m1" ? 14 : team.id === "u15f1" ? 11 : 13,
    nextSessions: team.id === "u13m1" ? 2 : 1,
    averageAttendanceRate: team.id === "u13m1" ? 86 : team.id === "u15f1" ? 78 : 82,
    averageEvaluationScore: team.id === "u13m1" ? 3.4 : team.id === "u15f1" ? 3.1 : 3.6,
    objectivesProgressRate: objectives.length ? Math.round(((reachedObjectives + inProgressObjectives * 0.55) / objectives.length) * 100) : 0,
    sessionsCreated: team.id === "u13m1" ? 18 : 12,
    attendancesFilled: hasAttendance ? 15 : 0,
    evaluationsCompleted: hasEvaluations ? 10 : 0,
    linkedDocumentsCount: documents.length,
    alerts,
  };
}

export function computeTeamStats(teamId: string, season: string): TeamStats {
  const team = getTeamProfile(teamId);
  const staff = getTeamStaff(teamId);
  const objectives = getTeamObjectives(teamId).filter((objective) => objective.season === season);
  const documents = getTeamDocuments(teamId);
  const indicators = computeTeamIndicators(team, staff, objectives, documents);

  return {
    teamId,
    season,
    playersCount: indicators.playersCount,
    staffCount: staff.filter((member) => member.isActive).length,
    sessionsCount: indicators.sessionsCreated,
    attendanceRate: indicators.averageAttendanceRate,
    evaluationsCount: indicators.evaluationsCompleted,
    documentsCount: indicators.linkedDocumentsCount,
    activeObjectivesCount: objectives.filter((objective) => objective.status === "en_cours" || objective.status === "a_faire" || objective.status === "a_travailler").length,
    reachedObjectivesCount: objectives.filter((objective) => objective.status === "atteint").length,
    averageProgression: Math.round((indicators.objectivesProgressRate + indicators.averageAttendanceRate + indicators.averageEvaluationScore * 20) / 3),
  };
}

export function buildTeamsDashboardData(
  teams: TeamProfile[],
  staff: TeamStaffMember[],
  objectives: TeamObjective[],
  documents: TeamLinkedDocument[]
): TeamDashboardData {
  const activeTeams = teams.filter((team) => team.status === "active" || team.status === "actif");
  return {
    activeTeamsCount: activeTeams.length,
    teamsWithoutHeadCoach: teams.filter((team) => !staff.some((member) => member.teamId === team.id && isHeadCoachRole(member.role) && member.isActive)).length,
    teamsWithoutSeasonObjectives: teams.filter((team) => !objectives.some((objective) => objective.teamId === team.id && objective.season === team.season)).length,
    teamsWithoutActivePlanning: teams.filter((team) => !documents.some((document) => document.teamId === team.id && document.documentType === "planning")).length,
    teamsWithMissingAttendance: teams.filter((team) => !documents.some((document) => document.teamId === team.id && document.documentType === "presence")).length,
    teamsWithoutRecentEvaluation: teams.filter((team) => !documents.some((document) => document.teamId === team.id && document.documentType === "evaluation")).length,
    teamsWithMissingDocuments: teams.filter((team) => documents.filter((document) => document.teamId === team.id).length < 2).length,
    teamsToArchive: teams.filter((team) => team.status === "archived" || team.status === "archive").length,
    nextDeadlines: teams.map((team, index) => ({
      teamId: team.id,
      teamName: team.name,
      label: index % 2 === 0 ? "Bilan objectifs" : "Point staff",
      date: index % 2 === 0 ? "2026-09-15" : "2026-09-22",
    })),
  };
}
