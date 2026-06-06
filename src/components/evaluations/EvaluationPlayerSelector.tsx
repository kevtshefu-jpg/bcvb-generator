import type { EvaluationPeriod, EvaluationPlayer, EvaluationTeam } from "../../types/evaluations";

const periods: Array<{ value: EvaluationPeriod; label: string }> = [
  { value: "debut_saison", label: "Début saison" },
  { value: "mensuel", label: "Mensuel" },
  { value: "ponctuel", label: "Ponctuel" },
  { value: "trimestre_1", label: "Trimestre 1" },
  { value: "trimestre_2", label: "Trimestre 2" },
  { value: "trimestre_3", label: "Trimestre 3" },
  { value: "mi_saison", label: "Mi-saison" },
  { value: "fin_saison", label: "Fin saison" },
  { value: "stage", label: "Stage" },
  { value: "detection", label: "Détection" },
  { value: "bilan_libre", label: "Bilan libre" },
];

export function EvaluationPlayerSelector({
  season,
  category,
  teamId,
  playerId,
  period,
  level,
  teams,
  players,
  disabled,
  onChange,
}: {
  season: string;
  category: string;
  teamId: string;
  playerId: string;
  period: EvaluationPeriod;
  level: string;
  teams: EvaluationTeam[];
  players: EvaluationPlayer[];
  disabled?: boolean;
  onChange: (patch: Partial<{ season: string; category: string; teamId: string; playerId: string; period: EvaluationPeriod; level: string }>) => void;
}) {
  const teamPlayers = players.filter((player) => player.teamId === teamId);

  return (
    <section className="evaluation-card evaluation-selector">
      <div className="evaluations-section-title">
        <span>Filtres</span>
        <h2>Saison, équipe, joueur et période</h2>
      </div>
      <div className="evaluation-selector-grid">
        <label>
          Saison
          <input disabled={disabled} value={season} onChange={(event) => onChange({ season: event.target.value })} />
        </label>
        <label>
          Catégorie
          <input disabled={disabled} value={category} onChange={(event) => onChange({ category: event.target.value })} />
        </label>
        <label>
          Équipe
          <select disabled={disabled} value={teamId} onChange={(event) => onChange({ teamId: event.target.value })}>
            {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select>
        </label>
        <label>
          Joueur
          <select disabled={disabled} value={playerId} onChange={(event) => onChange({ playerId: event.target.value })}>
            {teamPlayers.map((player) => <option key={player.id} value={player.id}>{player.firstName} {player.lastName}</option>)}
          </select>
        </label>
        <label>
          Période
          <select disabled={disabled} value={period} onChange={(event) => onChange({ period: event.target.value as EvaluationPeriod })}>
            {periods.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label>
          Niveau / modèle
          <input disabled={disabled} value={level} onChange={(event) => onChange({ level: event.target.value })} />
        </label>
      </div>
    </section>
  );
}
