import type { RosterPageStatus, RosterTeam } from '../rosterModels'

const content: Record<Exclude<RosterPageStatus, 'READY'>, { title: string; detail: string }> = {
  LOADING: { title: 'Chargement de l’effectif', detail: 'Lecture des données partagées du club…' },
  EMPTY: { title: 'Aucun joueur actif', detail: 'Cette équipe ne possède actuellement aucun joueur actif pour cette saison.' },
  FORBIDDEN: { title: 'Effectif non accessible', detail: 'Vos droits ne permettent pas de consulter l’effectif de cette équipe.' },
  ERROR: { title: 'Effectif indisponible', detail: 'La lecture a échoué. Vous pouvez réessayer sans modifier les données.' },
  NO_TEAM_AVAILABLE: { title: 'Aucune équipe disponible', detail: 'Aucune équipe active n’est visible pour votre profil.' },
}

export function RosterStatePanel({ status, team, onRetry }: {
  status: Exclude<RosterPageStatus, 'READY'>
  team?: RosterTeam
  onRetry?: () => void
}) {
  const state = content[status]
  return (
    <section className="roster-read-card roster-state-panel" role={status === 'ERROR' ? 'alert' : 'status'} aria-live="polite">
      <h2>{state.title}</h2>
      {team ? <p>{team.name} · {team.season}</p> : null}
      <p>{state.detail}</p>
      {status === 'ERROR' && onRetry ? <button type="button" onClick={onRetry}>Réessayer</button> : null}
    </section>
  )
}
