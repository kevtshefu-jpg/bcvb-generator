import type { RosterMember, RosterTeam } from '../rosterModels'

type Props = {
  member: RosterMember
  team: RosterTeam
  submitting: boolean
  errorMessage: string | null
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export function RosterMembershipDeactivatePanel({ member, team, submitting, errorMessage, onConfirm, onCancel }: Props) {
  return (
    <section className="roster-read-card roster-membership-confirm" aria-labelledby="roster-deactivate-title">
      <p className="bcvb-eyebrow">Retrait de l’effectif</p>
      <h2 id="roster-deactivate-title">{member.firstName} {member.lastName}</h2>
      <p>Équipe : <strong>{team.name}</strong> — saison <strong>{team.season}</strong>.</p>
      <p>Cette action désactive uniquement l’appartenance à cette équipe. L’identité canonique du joueur n’est pas supprimée.</p>
      {errorMessage ? <p role="alert" className="roster-search-error">{errorMessage}</p> : null}
      <div className="roster-create-actions">
        <button type="button" disabled={submitting} onClick={onCancel}>Annuler</button>
        <button type="button" disabled={submitting} onClick={() => void onConfirm()}>{submitting ? 'Retrait…' : 'Confirmer le retrait de l’effectif'}</button>
      </div>
    </section>
  )
}
