import { Link, useLocation } from "react-router-dom";
import { getTeamProfileBasePath } from "../../lib/teams/teamRoutes";
import { isHeadCoachRole } from "../../lib/teams/teamStaff";
import type { TeamIndicators, TeamProfile, TeamStaffMember } from "../../types/teams";

export function TeamDashboardCard({
  team,
  staff,
  indicators,
}: {
  team: TeamProfile;
  staff: TeamStaffMember[];
  indicators: TeamIndicators;
}) {
  const { pathname } = useLocation();
  const headCoach = staff.find((member) => isHeadCoachRole(member.role) && member.isActive);
  const profileBasePath = getTeamProfileBasePath(pathname);

  return (
    <article className="team-card">
      <div className="team-card__top">
        <span>{team.status}</span>
        <strong>{team.category}</strong>
      </div>
      <h2>{team.name}</h2>
      <p>{team.level} · {team.gender || "mixte"} · {team.season} · {team.championship || "Championnat à renseigner"}</p>
      <dl>
        <div><dt>Coach</dt><dd>{headCoach?.name || "À affecter"}</dd></div>
        <div><dt>Joueurs</dt><dd>{indicators.playersCount}</dd></div>
        <div><dt>Prochaines séances</dt><dd>{indicators.nextSessions}</dd></div>
        <div><dt>Présence moyenne</dt><dd>{indicators.averageAttendanceRate}%</dd></div>
        <div><dt>Évaluation moyenne</dt><dd>{indicators.averageEvaluationScore}/5</dd></div>
        <div><dt>Objectifs</dt><dd>{indicators.objectivesProgressRate}%</dd></div>
      </dl>
      {indicators.alerts[0] && <p className="team-card__alert">{indicators.alerts[0]}</p>}
      <Link className="bcvb-button-primary" to={`${profileBasePath}/${team.id}`}>Ouvrir fiche</Link>
    </article>
  );
}
