import type { MembershipRole, RosterImportRow, RosterPermissionSet, Team } from "../../types/roster";
import { buildPlanningContextFromTeam } from "../../lib/roster/rosterScoring";

const membershipRoles: MembershipRole[] = ["joueur", "partenaire entraînement", "passerelle", "blessé", "essai"];

export function TeamAssignmentPanel({
  rows,
  team,
  permissions,
  onTeamChange,
  onPatchRows,
}: {
  rows: RosterImportRow[];
  team: Partial<Team>;
  permissions: RosterPermissionSet;
  onTeamChange: (team: Partial<Team>) => void;
  onPatchRows: (patch: Partial<RosterImportRow>) => void;
}) {
  const players = rows.map((row) => row.mapped || {});
  const planningContext = buildPlanningContextFromTeam(team, players);

  return (
    <section className="bcvb-tool-card roster-section">
      <div className="roster-section-header">
        <div>
          <span>Affectation équipe</span>
          <h2>Équipe, saison et passerelles</h2>
        </div>
        <strong>{rows.filter((row) => row.targetTeamName).length}/{rows.length} affectés</strong>
      </div>
      <div className="roster-team-grid">
        <label>
          Équipe existante ou nouvelle
          <input disabled={!permissions.canAssignTeams} value={team.name || ""} onChange={(event) => onTeamChange({ ...team, name: event.target.value })} />
        </label>
        <label>
          Saison
          <input disabled={!permissions.canAssignTeams} value={team.season || ""} onChange={(event) => onTeamChange({ ...team, season: event.target.value })} />
        </label>
        <label>
          Catégorie
          <input disabled={!permissions.canAssignTeams} value={team.category || ""} onChange={(event) => onTeamChange({ ...team, category: event.target.value as Team["category"] })} />
        </label>
        <label>
          Niveau
          <input disabled={!permissions.canAssignTeams} value={team.level || ""} onChange={(event) => onTeamChange({ ...team, level: event.target.value as Team["level"] })} />
        </label>
        <label>
          Fréquence entraînement
          <input disabled={!permissions.canAssignTeams} type="number" min="1" max="5" value={team.trainingFrequencyPerWeek || 2} onChange={(event) => onTeamChange({ ...team, trainingFrequencyPerWeek: Number(event.target.value) || 1 })} />
        </label>
        <label>
          Hétérogénéité
          <select disabled={!permissions.canAssignTeams} value={team.heterogeneityLevel || "moyen"} onChange={(event) => onTeamChange({ ...team, heterogeneityLevel: event.target.value as Team["heterogeneityLevel"] })}>
            <option value="faible">Faible</option>
            <option value="moyen">Moyen</option>
            <option value="fort">Fort</option>
          </select>
        </label>
        <label>
          Rôle par défaut
          <select disabled={!permissions.canAssignTeams} onChange={(event) => onPatchRows({ membershipRole: event.target.value as MembershipRole })}>
            {membershipRoles.map((role) => <option key={role}>{role}</option>)}
          </select>
        </label>
      </div>
      <div className="coach-actions">
        <button className="bcvb-button-primary" type="button" disabled={!permissions.canAssignTeams} onClick={() => onPatchRows({ targetTeamName: team.name || "Équipe BCVB" })}>
          Affecter plusieurs joueurs
        </button>
        <button className="bcvb-button-secondary" type="button" disabled={!permissions.canCreateTeam}>
          Créer équipe
        </button>
      </div>
      <div className="roster-planning-context">
        <span>Contexte planification</span>
        <p>{planningContext.playerCount} joueurs · {planningContext.ageRange} · densité {planningContext.recommendedPlanningDensity}</p>
        <p>Priorités : {planningContext.suggestedPriorities.join(", ") || "À définir"}</p>
        {planningContext.alerts.map((alert) => <strong key={alert}>{alert}</strong>)}
      </div>
    </section>
  );
}
