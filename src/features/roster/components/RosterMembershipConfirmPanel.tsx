type Props = {
  firstName: string
  lastName: string
  teamName: string
  season: string
  submitting: boolean
  errorMessage: string | null
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export function RosterMembershipConfirmPanel({ firstName, lastName, teamName, season, submitting, errorMessage, onConfirm, onCancel }: Props) {
  return (
    <section className="roster-read-card roster-membership-confirm" aria-labelledby="roster-membership-title">
      <p className="bcvb-eyebrow">Ajout à l’effectif</p>
      <h2 id="roster-membership-title">{firstName} {lastName}</h2>
      <p>Équipe cible : <strong>{teamName}</strong> — saison <strong>{season}</strong>.</p>
      <p>Cette confirmation ajoute le joueur à cette équipe ou réactive son appartenance existante. Elle ne modifie pas son identité.</p>
      {errorMessage ? <p role="alert" className="roster-search-error">{errorMessage}</p> : null}
      <div className="roster-create-actions">
        <button type="button" disabled={submitting} onClick={onCancel}>Annuler</button>
        <button type="button" disabled={submitting} onClick={() => void onConfirm()}>{submitting ? 'Ajout…' : 'Confirmer l’ajout à l’effectif'}</button>
      </div>
    </section>
  )
}
