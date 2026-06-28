import type { DirectorDashboardIndicator, DirectorTeamOverview } from "../../types/directors";
import { EmptyState, MobileDetailCard, ResponsiveDataList, StatusBadge } from "../ui/ResponsiveDataView";
import { DirectorStatusBadge } from "./DirectorStatusBadge";

export function DirectorSportDashboard({
  indicators,
  teams,
}: {
  indicators: DirectorDashboardIndicator[];
  teams: DirectorTeamOverview[];
}) {
  return (
    <section className="director-card">
      <div className="director-card__header">
        <div>
          <span>Pilotage sportif</span>
          <h2>État des équipes et alertes</h2>
        </div>
        <DirectorStatusBadge status={teams.some((team) => team.alerts.length > 0) ? "warning" : "ok"} />
      </div>

      <div className="director-kpi-grid">
        {indicators.slice(0, 5).map((indicator) => (
          <article key={indicator.id} className={`director-kpi director-kpi--${indicator.status}`}>
            <span>{indicator.label}</span>
            <strong>{indicator.value}</strong>
            <p>{indicator.description}</p>
          </article>
        ))}
      </div>

      <div className="director-table-scroll responsive-data-table">
        <table className="director-table">
          <thead>
            <tr>
              <th>Équipe</th>
              <th>Catégorie</th>
              <th>Niveau</th>
              <th>Coach</th>
              <th>Effectif</th>
              <th>Planification</th>
              <th>Présences</th>
              <th>Évaluations</th>
              <th>Alertes</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id}>
                <td>{team.name}</td>
                <td>{team.category}</td>
                <td>{team.level || "À confirmer"}</td>
                <td>{team.headCoach || "À affecter"}</td>
                <td>{team.playersCount}/{team.targetPlayersCount || "cible"}</td>
                <td><DirectorStatusBadge status={team.planningStatus} /></td>
                <td><DirectorStatusBadge status={team.presenceStatus} /></td>
                <td><DirectorStatusBadge status={team.evaluationStatus} /></td>
                <td>{team.alerts.length ? team.alerts.join(" · ") : "OK"}</td>
                <td><a href={`/club/equipes/${team.id}`}>Voir</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="responsive-data-mobile">
        <ResponsiveDataList
          empty={(
            <EmptyState
              title="Aucune équipe à piloter"
              description="Les équipes apparaîtront ici dès que le référentiel sportif sera alimenté."
            />
          )}
        >
          {teams.map((team) => (
            <MobileDetailCard
              key={team.id}
              tone={team.alerts.length > 0 ? "is-warning" : "is-valid"}
              eyebrow={team.category}
              title={team.name}
              subtitle={team.alerts.length ? team.alerts.join(" · ") : "Aucune alerte prioritaire"}
              badge={<StatusBadge tone={team.alerts.length > 0 ? "warning" : "success"}>{team.alerts.length ? "À suivre" : "OK"}</StatusBadge>}
              items={[
                { label: "Niveau", value: team.level || "À confirmer" },
                { label: "Coach", value: team.headCoach || "À affecter" },
                { label: "Effectif", value: `${team.playersCount}/${team.targetPlayersCount || "cible"}` },
                { label: "Planification", value: <DirectorStatusBadge status={team.planningStatus} /> },
                { label: "Présences", value: <DirectorStatusBadge status={team.presenceStatus} /> },
                { label: "Évaluations", value: <DirectorStatusBadge status={team.evaluationStatus} /> },
              ]}
              actions={<a href={`/club/equipes/${team.id}`}>Voir l’équipe</a>}
            />
          ))}
        </ResponsiveDataList>
      </div>
    </section>
  );
}
