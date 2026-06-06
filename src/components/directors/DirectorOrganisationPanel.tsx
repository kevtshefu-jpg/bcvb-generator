import type { DirectorTeamOverview } from "../../types/directors";
import { teamProfiles } from "../../lib/teams/teamProfiles";
import { DirectorStatusBadge } from "./DirectorStatusBadge";

export function DirectorOrganisationPanel({ teams }: { teams: DirectorTeamOverview[] }) {
  return (
    <section className="director-card">
      <div className="director-card__header">
        <div>
          <span>Organisation</span>
          <h2>Équipes, référents et logistique</h2>
        </div>
        <DirectorStatusBadge status={teams.some((team) => !team.headCoach || team.alerts.length > 0) ? "warning" : "ok"} />
      </div>

      <div className="directors-grid directors-grid--cards">
        {teams.map((team) => {
          const profile = teamProfiles.find((item) => item.id === team.id);
          const rosterGap = (team.targetPlayersCount || 0) - team.playersCount;
          return (
            <article key={team.id} className="director-organisation-card">
              <header>
                <div>
                  <span>{team.category} · {team.level || "Niveau à préciser"}</span>
                  <h3>{team.name}</h3>
                </div>
                <DirectorStatusBadge status={team.alerts.length ? "warning" : "ok"} />
              </header>
              <dl>
                <div><dt>Coach principal</dt><dd>{team.headCoach || "À affecter"}</dd></div>
                <div><dt>Coach adjoint</dt><dd>{team.assistantCoach || "À confirmer"}</dd></div>
                <div><dt>Parent référent</dt><dd>{team.parentReferent || "À nommer"}</dd></div>
                <div><dt>Dirigeant référent</dt><dd>{team.directorReferent || "À nommer"}</dd></div>
                <div><dt>Créneaux</dt><dd>{profile?.trainingSlots?.join(" · ") || "À confirmer"}</dd></div>
                <div><dt>Salle principale</dt><dd>{profile?.mainGym || "À confirmer"}</dd></div>
                <div><dt>Effectif</dt><dd>{team.playersCount} / {team.targetPlayersCount || "cible"}</dd></div>
                <div><dt>État effectif</dt><dd>{rosterGap < -2 ? "Sureffectif" : rosterGap > 2 ? "Sous-effectif" : "Équilibré"}</dd></div>
              </dl>
              <p>{team.alerts.length ? team.alerts.join(" ") : "Organisation lisible pour la commission."}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
