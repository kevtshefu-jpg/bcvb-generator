import { FormEvent, useState } from 'react'
import type { RosterSearchInput, RosterSearchResult } from '../rosterModels'

type Props = {
  searching: boolean
  result: RosterSearchResult | null
  errorMessage: string | null
  onSearch: (input: RosterSearchInput) => Promise<void>
  onClose: () => void
}

const initialInput: RosterSearchInput = { firstName: '', lastName: '', licenseNumber: '', birthDate: '' }

const labels = {
  EXACT: 'Correspondance exacte',
  PROBABLE: 'Correspondance probable',
  AMBIGUOUS: 'Vérification nécessaire',
} as const

export function RosterPlayerSearchPanel({ searching, result, errorMessage, onSearch, onClose }: Props) {
  const [input, setInput] = useState<RosterSearchInput>(initialInput)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSearch(input)
  }

  return (
    <section className="roster-read-card roster-search-panel" aria-labelledby="roster-search-title">
      <div className="roster-read-section-heading">
        <div>
          <h2 id="roster-search-title">Rechercher un joueur</h2>
          <p>Recherchez une identité existante avant toute création. Licence ou prénom et nom sont requis.</p>
        </div>
        <button type="button" onClick={onClose} disabled={searching}>Fermer</button>
      </div>

      <form className="roster-search-form" onSubmit={submit}>
        <label>Prénom<input value={input.firstName} maxLength={200} autoComplete="off" onChange={(event) => setInput({ ...input, firstName: event.target.value })} /></label>
        <label>Nom<input value={input.lastName} maxLength={200} autoComplete="off" onChange={(event) => setInput({ ...input, lastName: event.target.value })} /></label>
        <label>N° de licence <span>(facultatif)</span><input value={input.licenseNumber} maxLength={100} autoComplete="off" onChange={(event) => setInput({ ...input, licenseNumber: event.target.value })} /></label>
        <label>Date de naissance <span>(facultative)</span><input type="date" value={input.birthDate} onChange={(event) => setInput({ ...input, birthDate: event.target.value })} /></label>
        <div className="roster-search-actions"><button type="submit" disabled={searching}>{searching ? 'Recherche…' : 'Rechercher'}</button></div>
      </form>

      {errorMessage ? <p role="alert" className="roster-search-error">{errorMessage}</p> : null}
      {result?.matchState === 'NO_MATCH' ? <div className="roster-search-empty" role="status"><strong>Aucune identité correspondante.</strong><p>La création d’un nouveau joueur n’est pas encore activée dans cette étape.</p></div> : null}
      {result && result.candidates.length > 0 ? (
        <div className="roster-search-results" aria-live="polite">
          <h3>Résultats</h3>
          <ul>
            {result.candidates.map((candidate) => (
              <li key={candidate.playerId} className="roster-search-result-card">
                <div className="roster-search-result-heading">
                  <strong>{candidate.firstName} {candidate.lastName}</strong>
                  <span className="roster-search-classification">{labels[candidate.classification]}</span>
                </div>
                <dl>
                  {candidate.birthYear ? <><dt>Année de naissance</dt><dd>{candidate.birthYear}</dd></> : null}
                  {candidate.licenseHint ? <><dt>Licence</dt><dd>{candidate.licenseHint}</dd></> : null}
                  <dt>Équipe(s) active(s)</dt>
                  <dd>{candidate.activeMemberships.length > 0 ? candidate.activeMemberships.map((membership) => `${membership.teamName} — ${membership.season}`).join(', ') : 'Aucune'}</dd>
                </dl>
                <p className="roster-search-selection-note">Sélection et ajout à l’effectif seront activés dans l’étape suivante.</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
