import { Link } from "react-router-dom";
import type { TeamProfile } from "../../types/teams";

export function TeamQuickActions({
  team,
  planningPrefill,
  sessionPrefill,
  canManageRoster,
  canViewEvaluations,
  canExport,
}: {
  team: TeamProfile;
  planningPrefill?: unknown;
  sessionPrefill?: unknown;
  canManageRoster: boolean;
  canViewEvaluations: boolean;
  canExport: boolean;
}) {
  return (
    <section className="team-quick-actions">
      <div className="teams-section-title">
        <span>Accès rapides</span>
        <h2>{team.category} · {team.season}</h2>
      </div>
      <div>
        <Link to="/coach/seances" state={sessionPrefill}>Créer une séance</Link>
        <Link to="/coach/planifications" state={planningPrefill}>Créer une planification</Link>
        {canManageRoster ? <Link to="/effectifs">Gérer l’effectif</Link> : <span>Effectif en lecture seule</span>}
        <Link to="/presences">Faire l’appel</Link>
        {canViewEvaluations ? <Link to="/evaluations">Évaluations joueurs</Link> : <span>Évaluations masquées</span>}
        {canExport ? <a href="#team-exports">Exports équipe</a> : <span>Exports non autorisés</span>}
      </div>
    </section>
  );
}

