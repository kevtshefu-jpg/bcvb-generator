import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { TeamLinkedDocument, TeamObjective, TeamProfile, TeamStaffMember } from "../../types/teams";
import { useAuth } from "../../features/auth/context/AuthContext";
import {
  getTeamDocuments,
  getTeamHistory,
  getTeamObjectives,
  getTeamProfile,
  getTeamStaff,
} from "../../lib/teams/teamProfiles";
import { computeTeamIndicators } from "../../lib/teams/teamStats";
import { buildPlanningPrefillFromTeam, buildSessionPrefillFromTeam } from "../../lib/teams/teamLinks";
import { getTeamPermissions } from "../../lib/teams/teamPermissions";
import { isHeadCoachRole } from "../../lib/teams/teamStaff";
import { TeamIdentityCard } from "./TeamIdentityCard";
import { TeamStaffPanel } from "./TeamStaffPanel";
import { TeamObjectivesPanel } from "./TeamObjectivesPanel";
import { TeamLinkedDocumentsPanel } from "./TeamLinkedDocumentsPanel";
import { TeamHistoryPanel } from "./TeamHistoryPanel";
import { TeamTabs } from "./TeamTabs";
import { TeamExportPanel } from "./TeamExportPanel";
import { TeamDashboard } from "./TeamDashboard";
import { TeamQuickActions } from "./TeamQuickActions";
import { TeamArchivePanel } from "./TeamArchivePanel";
import "../../styles/teams.css";

export function TeamProfilePage() {
  const { teamId } = useParams();
  const { profile } = useAuth();
  const initialTeam = useMemo(() => getTeamProfile(teamId), [teamId]);
  const [team, setTeam] = useState<TeamProfile>(initialTeam);
  const [staff, setStaff] = useState<TeamStaffMember[]>(() => getTeamStaff(initialTeam.id));
  const [objectives, setObjectives] = useState<TeamObjective[]>(() => getTeamObjectives(initialTeam.id));
  const [documents, setDocuments] = useState<TeamLinkedDocument[]>(() => getTeamDocuments(initialTeam.id));
  const [activeTab, setActiveTab] = useState("Vue d’ensemble");
  const history = getTeamHistory(team.id);
  const indicators = computeTeamIndicators(team, staff, objectives, documents);
  const permissions = getTeamPermissions(profile, team.id);
  const headCoach = staff.find((member) => isHeadCoachRole(member.role) && member.isActive);
  const planningPrefill = buildPlanningPrefillFromTeam(team, objectives);
  const sessionPrefill = buildSessionPrefillFromTeam(team, objectives);
  const canTransformDocuments = profile?.role === "admin";

  if (!permissions.canView) {
    return (
      <main className="teams-page">
        <section className="bcvb-dashboard-hero">
          <div>
            <p className="bcvb-eyebrow">Gestion des équipes</p>
            <h1 className="bcvb-title-xl">Accès réservé</h1>
            <p className="bcvb-subtitle">La fiche équipe est réservée aux profils autorisés.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="teams-page">
      <section className="bcvb-dashboard-hero teams-profile-header">
        <div>
          <p className="bcvb-eyebrow">Fiche équipe · Badge identité BCVB</p>
          <h1 className="bcvb-title-xl">{team.name}</h1>
          <p className="bcvb-subtitle">{team.category} · {team.level} · {team.season} · Coach : {headCoach?.name || "À affecter"}</p>
        </div>
        <div className="teams-profile-status">
          <strong>{team.status}</strong>
          <span>Défendre Fort · Courir · Partager</span>
        </div>
      </section>

      <TeamTabs active={activeTab} onChange={setActiveTab} />
      <TeamQuickActions
        team={team}
        planningPrefill={planningPrefill}
        sessionPrefill={sessionPrefill}
        canManageRoster={permissions.canManageRoster}
        canViewEvaluations={permissions.canViewEvaluations}
        canExport={permissions.canExport}
      />

      <section className="team-profile-layout">
        <div className="team-profile-main">
          {activeTab === "Vue d’ensemble" && (
            <TeamDashboard team={team} staff={staff} objectives={objectives} documents={documents} permissions={permissions} />
          )}

          {(activeTab === "Vue d’ensemble" || activeTab === "Effectif") && (
            <TeamIdentityCard team={team} readOnly={!permissions.canEdit} onChange={setTeam} />
          )}

          {(activeTab === "Vue d’ensemble" || activeTab === "Staff") && (
            <TeamStaffPanel teamId={team.id} staff={staff} canManage={permissions.canManageStaff} onChange={setStaff} />
          )}

          {(activeTab === "Vue d’ensemble" || activeTab === "Objectifs") && (
            <TeamObjectivesPanel teamId={team.id} season={team.season} objectives={objectives} canEdit={permissions.canManageObjectives} onChange={setObjectives} />
          )}

          {activeTab === "Évaluations" && !permissions.canViewEvaluations && (
            <section className="team-alert-card">
              <div className="teams-section-title">
                <span>Évaluations joueurs</span>
                <h2>Accès limité</h2>
              </div>
              <p>Les évaluations techniques ne sont pas visibles pour ce profil.</p>
            </section>
          )}

          {(activeTab === "Vue d’ensemble" || ["Séances", "Planification", "Présences", "Évaluations", "Documents"].includes(activeTab)) && (activeTab !== "Évaluations" || permissions.canViewEvaluations) && (
            <TeamLinkedDocumentsPanel documents={documents} canEdit={permissions.canEdit} canTransform={canTransformDocuments} onChange={setDocuments} />
          )}

          {activeTab === "Historique" && (
            <>
              <TeamHistoryPanel history={history} canArchive={permissions.canArchive} />
              <TeamArchivePanel team={team} canArchive={permissions.canArchive} canDelete={permissions.canDelete} onChange={setTeam} />
            </>
          )}

          {activeTab === "Exports" && (
            <TeamExportPanel
              id="team-exports"
              team={team}
              staff={staff}
              objectives={objectives}
              documents={documents}
              history={history}
              indicators={indicators}
              canExport={permissions.canExport}
            />
          )}
        </div>

        <aside className="team-profile-sidebar">
          <section className="team-sidebar-card">
            <div className="teams-section-title">
              <span>Score suivi</span>
              <h2>{Math.round((indicators.objectivesProgressRate + indicators.averageAttendanceRate + indicators.averageEvaluationScore * 20) / 3)}%</h2>
            </div>
            <dl>
              <div><dt>Joueurs</dt><dd>{indicators.playersCount}</dd></div>
              <div><dt>Séances créées</dt><dd>{indicators.sessionsCreated}</dd></div>
              <div><dt>Présences remplies</dt><dd>{indicators.attendancesFilled}</dd></div>
              <div><dt>Évaluations réalisées</dt><dd>{indicators.evaluationsCompleted}</dd></div>
              <div><dt>Documents liés</dt><dd>{indicators.linkedDocumentsCount}</dd></div>
            </dl>
            <p>{indicators.alerts[0] || "Action recommandée : poursuivre le suivi régulier."}</p>
          </section>

          <section className="team-sidebar-card">
            <div className="teams-section-title">
              <span>Planification active</span>
              <h2>{documents.find((document) => document.documentType === "planning" || document.documentType === "planification")?.title || "À créer"}</h2>
            </div>
            <p>Prochain cycle : défense H-H · objectifs du cycle alignés avec les objectifs saison.</p>
            <Link className="bcvb-button-primary" to="/coach/planifications" state={planningPrefill}>Créer la planification de cette équipe</Link>
          </section>

          <section className="team-sidebar-card">
            <div className="teams-section-title">
              <span>Accès rapides</span>
              <h2>Modules liés</h2>
            </div>
            <Link to="/effectifs">Voir effectif équipe</Link>
            <Link to="/presences">Voir assiduité équipe</Link>
            <Link to="/evaluations">Voir évaluations équipe</Link>
            <Link to="/coach/seances" state={sessionPrefill}>Créer une séance pour cette équipe</Link>
            <Link to="/bibliotheque">Documents bibliothèque</Link>
          </section>
        </aside>
      </section>
    </main>
  );
}

export default TeamProfilePage;
