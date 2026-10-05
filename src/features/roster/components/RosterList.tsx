import type { RosterMember, RosterTeam } from '../rosterModels'

export function RosterList({ team, members, canDeactivate = false, onRequestDeactivate }: { team: RosterTeam; members: RosterMember[]; canDeactivate?: boolean; onRequestDeactivate?: (member: RosterMember) => void }) {
  return (
    <section className="roster-read-card" aria-labelledby="roster-list-heading">
      <div className="roster-read-section-heading">
        <div>
          <p className="bcvb-eyebrow">Effectif canonique</p>
          <h2 id="roster-list-heading">{team.name}</h2>
          <p>{team.category} · {team.level} · {team.season}</p>
        </div>
        <strong>{members.length} joueur{members.length > 1 ? 's' : ''}</strong>
      </div>
      <div className="roster-read-table-wrap">
        <table>
          <caption className="sr-only">Joueurs de {team.name} pour la saison {team.season}</caption>
          <thead><tr><th scope="col">Joueur</th><th scope="col">Catégorie</th><th scope="col">Statut</th>{canDeactivate ? <th scope="col">Action</th> : null}</tr></thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.membershipId}>
                <td data-label="Joueur"><strong>{member.firstName} {member.lastName}</strong></td>
                <td data-label="Catégorie">{member.playerCategory ?? '—'}</td>
                <td data-label="Statut"><span className="roster-read-status">{member.membershipStatus}</span></td>
                {canDeactivate ? <td data-label="Action"><button type="button" onClick={() => onRequestDeactivate?.(member)}>Retirer de l’effectif</button></td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
