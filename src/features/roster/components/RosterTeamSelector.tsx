import type { RosterTeam } from '../rosterModels'

export function RosterTeamSelector({ teams, selectedTeamId, disabled, onChange }: {
  teams: RosterTeam[]
  selectedTeamId: string
  disabled: boolean
  onChange: (teamId: string) => void
}) {
  return (
    <section className="roster-read-card roster-team-selector" aria-labelledby="roster-team-heading">
      <div>
        <p className="bcvb-eyebrow">Équipe-saison</p>
        <h2 id="roster-team-heading">Choisir un effectif</h2>
      </div>
      <label htmlFor="roster-team-select">Équipe</label>
      <select id="roster-team-select" value={selectedTeamId} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        {teams.map((team) => (
          <option value={team.id} key={team.id}>{team.name} · {team.category} · {team.level} · {team.season}</option>
        ))}
      </select>
    </section>
  )
}
