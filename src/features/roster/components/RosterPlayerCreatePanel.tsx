import { useState } from 'react'
import type { FormEvent } from 'react'
import type { RosterSearchCandidate, RosterSearchInput } from '../rosterModels'

type Props = {
  input: RosterSearchInput
  candidates: RosterSearchCandidate[]
  creating: boolean
  errorMessage: string | null
  onCreate: (reason: string) => Promise<void>
  onCancel: () => void
}

export function RosterPlayerCreatePanel({ input, candidates, creating, errorMessage, onCreate, onCancel }: Props) {
  const [reason, setReason] = useState('')
  const distinct = candidates.length > 0

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onCreate(reason)
  }

  return (
    <section className="roster-read-card roster-create-panel" aria-labelledby="roster-create-title">
      <h2 id="roster-create-title">{distinct ? 'Confirmer une personne distincte' : 'Créer une nouvelle identité'}</h2>
      <p><strong>{input.firstName.trim()} {input.lastName.trim()}</strong>{input.birthDate ? ` — né(e) le ${input.birthDate}` : ''}</p>
      <p>Cette action crée uniquement l’identité canonique. Elle ne l’ajoute à aucune équipe.</p>
      {distinct ? (
        <>
          <p>Identités concurrentes reconnues :</p>
          <ul>{candidates.map((candidate) => <li key={candidate.playerId}>{candidate.firstName} {candidate.lastName}{candidate.birthYear ? ` — ${candidate.birthYear}` : ''}</li>)}</ul>
        </>
      ) : null}
      <form onSubmit={submit}>
        {distinct ? (
          <label>Justification de personne distincte
            <textarea value={reason} minLength={3} maxLength={500} required onChange={(event) => setReason(event.target.value)} />
          </label>
        ) : null}
        {errorMessage ? <p role="alert" className="roster-search-error">{errorMessage}</p> : null}
        <div className="roster-create-actions">
          <button type="button" disabled={creating} onClick={onCancel}>Annuler</button>
          <button type="submit" disabled={creating || (distinct && reason.trim().length < 3)}>
            {creating ? 'Création…' : distinct ? 'Confirmer personne distincte' : 'Créer l’identité'}
          </button>
        </div>
      </form>
    </section>
  )
}
