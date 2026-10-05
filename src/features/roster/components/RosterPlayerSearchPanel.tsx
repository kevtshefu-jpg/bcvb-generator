import { useState } from 'react'
import type { FormEvent } from 'react'
import type { RosterSearchCandidate, RosterSearchInput, RosterSearchResult } from '../rosterModels'

type Props = {
  searching: boolean
  result: RosterSearchResult | null
  errorMessage: string | null
  onSearch: (input: RosterSearchInput) => Promise<void>
  canSelectCandidate: boolean
  selectedPlayerId: string | null
  onSelectCandidate: (candidate: RosterSearchCandidate) => void
  canCreatePlayer: boolean
  onRequestCreate: (input: RosterSearchInput, candidates: RosterSearchCandidate[]) => void
  onClose: () => void
}

const initialInput: RosterSearchInput = { firstName: '', lastName: '', licenseNumber: '', birthDate: '' }

const labels = {
  EXACT: 'Correspondance exacte',
  PROBABLE: 'Correspondance probable',
  AMBIGUOUS: 'Vérification nécessaire',
} as const

export function RosterPlayerSearchPanel({
  searching,
  result,
  errorMessage,
  onSearch,
  canSelectCandidate,
  selectedPlayerId,
  onSelectCandidate,
  canCreatePlayer,
  onRequestCreate,
  onClose,
}: Props) {
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
      {result?.matchState === 'NO_MATCH' ? (
        <div className="roster-search-empty" role="status">
          <strong>Aucune identité correspondante.</strong>
          <p>Vérifiez les informations avant de créer une nouvelle identité.</p>
          {canCreatePlayer ? <button type="button" onClick={() => onRequestCreate(input, [])}>Créer cette identité</button> : null}
        </div>
      ) : null}
      {result?.matchState === 'AMBIGUOUS' && result.candidates.length === 0 ? (
        <div className="roster-search-error" role="alert">
          <strong>Vérification d’identité obligatoire.</strong>
          <p>Une identité conflictuelle existe mais ne peut pas être affichée. Ne créez pas de nouveau joueur avant vérification.</p>
        </div>
      ) : null}
      {result?.matchState === 'AMBIGUOUS' && result.candidates.length > 0 && canCreatePlayer ? (
        <div className="roster-search-warning">
          <strong>Vous pensez qu’il s’agit d’une autre personne ?</strong>
          <p>La création d’une personne distincte exige de reconnaître tous les candidats affichés et de justifier la décision.</p>
          <button type="button" onClick={() => onRequestCreate(input, result.candidates)}>Examiner une création distincte</button>
        </div>
      ) : null}
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
                  {candidate.archived ? <><dt>Statut</dt><dd>Identité archivée</dd></> : null}
                  <dt>Équipe(s) active(s)</dt>
                  <dd>{candidate.activeMemberships.length > 0 ? candidate.activeMemberships.map((membership) => `${membership.teamName} — ${membership.season}`).join(', ') : 'Aucune'}</dd>
                </dl>
                {candidate.archived ? (
                  <p className="roster-search-selection-note">Cette identité archivée ne peut pas être sélectionnée.</p>
                ) : canSelectCandidate ? (
                  <button
                    type="button"
                    className="roster-search-select-button"
                    aria-pressed={selectedPlayerId === candidate.playerId}
                    onClick={() => onSelectCandidate(candidate)}
                  >
                    {selectedPlayerId === candidate.playerId ? 'Identité sélectionnée' : 'Sélectionner cette identité'}
                  </button>
                ) : (
                  <p className="roster-search-selection-note">Votre profil peut rechercher cette identité, mais pas poursuivre son ajout à un effectif.</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
