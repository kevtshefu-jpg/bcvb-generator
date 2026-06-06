import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  teamLinkedDocuments,
  teamObjectives,
  teamProfiles,
  teamStaffMembers,
  getTeamDocuments,
  getTeamObjectives,
  getTeamStaff,
} from "../../lib/teams/teamProfiles";
import { getTeamProfileBasePath } from "../../lib/teams/teamRoutes";
import { buildTeamsDashboardData, computeTeamIndicators } from "../../lib/teams/teamStats";
import { isHeadCoachRole } from "../../lib/teams/teamStaff";
import { TeamDashboardCard } from "./TeamDashboardCard";
import "../../styles/teams.css";

export function TeamsPage() {
  const { pathname } = useLocation();
  const [season, setSeason] = useState("2026-2027");
  const [category, setCategory] = useState("all");
  const [gender, setGender] = useState("all");
  const [level, setLevel] = useState("all");
  const [status, setStatus] = useState("all");
  const [coach, setCoach] = useState("");
  const [gym, setGym] = useState("");
  const [championship, setChampionship] = useState("");
  const [query, setQuery] = useState("");
  const dashboard = useMemo(() => buildTeamsDashboardData(teamProfiles, teamStaffMembers, teamObjectives, teamLinkedDocuments), []);
  const profileBasePath = getTeamProfileBasePath(pathname);
  const seasons = [...new Set(teamProfiles.map((team) => team.season))];
  const categories = [...new Set(teamProfiles.map((team) => team.category))];
  const genders = [...new Set(teamProfiles.map((team) => team.gender || "mixte"))];
  const levels = [...new Set(teamProfiles.map((team) => team.level))];
  const statuses = [...new Set(teamProfiles.map((team) => team.status))];
  const filteredTeams = teamProfiles.filter((team) => {
    const teamStaff = getTeamStaff(team.id);
    const headCoach = teamStaff.find((member) => isHeadCoachRole(member.role) && member.isActive);
    const matchSeason = season === "all" || team.season === season;
    const matchCategory = category === "all" || team.category === category;
    const matchGender = gender === "all" || (team.gender || "mixte") === gender;
    const matchLevel = level === "all" || team.level === level;
    const matchStatus = status === "all" || team.status === status;
    const matchCoach = !coach || `${headCoach?.name || ""} ${teamStaff.map((member) => member.name).join(" ")}`.toLowerCase().includes(coach.toLowerCase());
    const matchGym = !gym || (team.mainGym || "").toLowerCase().includes(gym.toLowerCase());
    const matchChampionship = !championship || (team.championship || "").toLowerCase().includes(championship.toLowerCase());
    const matchQuery = !query || `${team.name} ${team.category} ${team.level} ${team.gender || ""} ${team.championship || ""} ${team.description || ""} ${(team.identityTags || []).join(" ")}`.toLowerCase().includes(query.toLowerCase());
    return matchSeason && matchCategory && matchGender && matchLevel && matchStatus && matchCoach && matchGym && matchChampionship && matchQuery;
  });

  function exportSummary() {
    const content = [
      "nom;categorie;niveau;saison;statut;joueurs;presence;evaluation;objectifs",
      ...filteredTeams.map((team) => {
        const indicators = computeTeamIndicators(team, getTeamStaff(team.id), getTeamObjectives(team.id), getTeamDocuments(team.id));
        return `${team.name};${team.category};${team.level};${team.season};${team.status};${indicators.playersCount};${indicators.averageAttendanceRate};${indicators.averageEvaluationScore};${indicators.objectivesProgressRate}`;
      }),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "synthese-equipes-bcvb.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="teams-page">
      <section className="bcvb-dashboard-hero teams-header">
        <div>
          <p className="bcvb-eyebrow">Gestion des équipes</p>
          <h1 className="bcvb-title-xl">Équipes, staffs, objectifs et suivi sportif BCVB</h1>
          <p className="bcvb-subtitle">Centraliser les équipes, les staffs, les objectifs, les documents et le suivi sportif BCVB.</p>
        </div>
        <div className="teams-header-actions">
          <button className="bcvb-button-primary" type="button">Créer une équipe</button>
          <a className="bcvb-button-secondary" href="/effectifs/import">Importer équipes</a>
          <button className="bcvb-button-secondary" type="button" onClick={exportSummary}>Exporter synthèse</button>
        </div>
      </section>

      <section className="teams-dashboard-strip">
        <article><span>Équipes actives</span><strong>{dashboard.activeTeamsCount}</strong></article>
        <article><span>Sans coach principal</span><strong>{dashboard.teamsWithoutHeadCoach}</strong></article>
        <article><span>Sans objectifs</span><strong>{dashboard.teamsWithoutSeasonObjectives}</strong></article>
        <article><span>Sans planification</span><strong>{dashboard.teamsWithoutActivePlanning}</strong></article>
        <article><span>Présences manquantes</span><strong>{dashboard.teamsWithMissingAttendance}</strong></article>
        <article><span>Sans évaluation récente</span><strong>{dashboard.teamsWithoutRecentEvaluation}</strong></article>
      </section>

      <section className="teams-filters">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher équipe, niveau, championnat" />
        <select value={season} onChange={(event) => setSeason(event.target.value)}>
          <option value="all">Toutes saisons</option>
          {seasons.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">Toutes catégories</option>
          {categories.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={gender} onChange={(event) => setGender(event.target.value)}>
          <option value="all">Tous sexes</option>
          {genders.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={level} onChange={(event) => setLevel(event.target.value)}>
          <option value="all">Tous niveaux</option>
          {levels.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">Tous statuts</option>
          {statuses.map((item) => <option key={item}>{item}</option>)}
        </select>
        <input value={coach} onChange={(event) => setCoach(event.target.value)} placeholder="Coach" />
        <input value={gym} onChange={(event) => setGym(event.target.value)} placeholder="Salle" />
        <input value={championship} onChange={(event) => setChampionship(event.target.value)} placeholder="Championnat" />
      </section>

      <section className="teams-grid">
        {filteredTeams.map((team) => (
          <TeamDashboardCard
            key={team.id}
            team={team}
            staff={getTeamStaff(team.id)}
            indicators={computeTeamIndicators(team, getTeamStaff(team.id), getTeamObjectives(team.id), getTeamDocuments(team.id))}
          />
        ))}
      </section>

      <section className="team-table-card">
        <h2>Tableau équipes</h2>
        <div className="team-table-scroll">
          <table className="bcvb-table-premium">
            <thead><tr><th>Équipe</th><th>Catégorie</th><th>Niveau</th><th>Coach principal</th><th>Statut</th><th>Fiche</th></tr></thead>
            <tbody>
              {filteredTeams.map((team) => {
                const headCoach = getTeamStaff(team.id).find((member) => isHeadCoachRole(member.role) && member.isActive);
                return (
                  <tr key={team.id}>
                    <td>{team.name}</td>
                    <td>{team.category}</td>
                    <td>{team.level}</td>
                    <td>{headCoach?.name || "À affecter"}</td>
                    <td>{team.status}</td>
                    <td><Link to={`${profileBasePath}/${team.id}`}>Ouvrir</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default TeamsPage;
