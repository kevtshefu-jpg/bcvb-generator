import type { TeamLinkedDocument, TeamObjective, TeamPermissionSet, TeamProfile, TeamStaffMember } from "../../types/teams";
import { computeTeamIndicators, computeTeamStats } from "../../lib/teams/teamStats";
import { TeamProfileCard } from "./TeamProfileCard";
import { TeamStatsPanel } from "./TeamStatsPanel";

export function TeamDashboard({
  team,
  staff,
  objectives,
  documents,
  permissions,
}: {
  team: TeamProfile;
  staff: TeamStaffMember[];
  objectives: TeamObjective[];
  documents: TeamLinkedDocument[];
  permissions: TeamPermissionSet;
}) {
  const indicators = computeTeamIndicators(team, staff, objectives, documents);
  const stats = computeTeamStats(team.id, team.season);

  return (
    <section className="team-dashboard">
      <TeamProfileCard team={team} staff={staff} indicators={indicators} />
      <TeamStatsPanel stats={stats} indicators={indicators} canViewEvaluations={permissions.canViewEvaluations} />
      <section className="team-alert-card">
        <div className="teams-section-title">
          <span>Alertes</span>
          <h2>Actions recommandées</h2>
        </div>
        {indicators.alerts.map((alert) => <p key={alert}>{alert}</p>)}
        {indicators.alerts.length === 0 && <p>Suivi équipe complet pour le moment.</p>}
      </section>
      <section className="team-identity-summary">
        <div className="teams-section-title">
          <span>Projet sportif</span>
          <h2>Intentions de saison</h2>
        </div>
        <dl>
          <div><dt>Objectif principal</dt><dd>{team.mainObjective || "À définir avec le staff."}</dd></div>
          <div><dt>Style de jeu</dt><dd>{team.styleOfPlay || "Courir, fixer, partager."}</dd></div>
          <div><dt>Défense</dt><dd>{team.defensiveIdentity || "Défense Homme à Homme."}</dd></div>
          <div><dt>Priorité technique</dt><dd>{team.technicalPriority || "À cadrer dans le prochain cycle."}</dd></div>
        </dl>
      </section>
    </section>
  );
}

