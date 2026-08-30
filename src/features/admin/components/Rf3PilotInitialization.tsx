import { useCallback, useEffect, useRef, useState } from 'react'

import { useAuth } from '../../auth/context/AuthContext'
import {
  rf3PilotImportService,
  type Rf3PilotImportResult,
  type Rf3PilotPrecheck,
} from '../services/rf3PilotImportService'
import './Rf3PilotInitialization.css'

const emptyPrecheck: Rf3PilotPrecheck = {
  teams: 0,
  players: 0,
  memberships: 0,
  staff: 0,
  kevinCandidates: 0,
  state: 'inconsistent',
}

export default function Rf3PilotInitialization() {
  const { session, profile } = useAuth()
  const [precheck, setPrecheck] = useState<Rf3PilotPrecheck>(emptyPrecheck)
  const [checking, setChecking] = useState(true)
  const [mutating, setMutating] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Rf3PilotImportResult | null>(null)
  const mutationInFlight = useRef(false)

  const authorized = Boolean(
    session &&
      profile?.role === 'admin' &&
      profile.is_active === true &&
      profile.profile_status === 'active',
  )

  const loadPrecheck = useCallback(async (preserveError = false) => {
    if (!authorized) return
    setChecking(true)
    if (!preserveError) setError(null)
    try {
      setPrecheck(await rf3PilotImportService.precheck())
    } catch {
      setPrecheck(emptyPrecheck)
      setError('Le précheck RF3 est indisponible. Aucun import ne peut être lancé.')
    } finally {
      setChecking(false)
    }
  }, [authorized])

  useEffect(() => {
    void loadPrecheck(false)
  }, [loadPrecheck])

  if (!authorized) return null

  const locked = precheck.state === 'initialized' || result?.status === 'IMPORTED' || result?.status === 'ALREADY_IMPORTED'
  const importDisabled = checking || mutating || precheck.state !== 'ready' || locked

  async function confirmImport() {
    if (mutationInFlight.current || importDisabled) return
    mutationInFlight.current = true
    setMutating(true)
    setConfirming(false)
    setError(null)
    try {
      const response = await rf3PilotImportService.importPilot()
      setResult(response)
      try {
        setPrecheck(await rf3PilotImportService.precheck())
      } catch {
        setError('Import terminé, mais le contrôle final est indisponible. Ne relancez pas l’import.')
      }
    } catch {
      setError('L’import RF3 a échoué. Aucun nouvel essai automatique n’a été effectué.')
      await loadPrecheck(true)
    } finally {
      mutationInFlight.current = false
      setMutating(false)
    }
  }

  return (
    <section className="rf3-pilot" aria-labelledby="rf3-pilot-title">
      <div className="rf3-pilot__heading">
        <div>
          <p className="rf3-pilot__eyebrow">Outil Admin isolé</p>
          <h2 id="rf3-pilot-title">Initialisation pilote RF3</h2>
        </div>
        <span className={`rf3-pilot__status rf3-pilot__status--${precheck.state}`}>
          {checking ? 'Vérification…' : precheck.state === 'ready' ? 'Prêt' : precheck.state === 'initialized' ? 'Initialisé' : 'À vérifier'}
        </span>
      </div>

      <dl className="rf3-pilot__summary">
        <div><dt>Équipe</dt><dd>RF3 - SF</dd></div>
        <div><dt>Saison</dt><dd>2026-2027</dd></div>
        <div><dt>Joueuses</dt><dd>7</dd></div>
        <div><dt>Adhésions</dt><dd>7 actives</dd></div>
        <div><dt>Staff</dt><dd>1 head coach</dd></div>
      </dl>

      {!checking && precheck.state === 'inconsistent' ? (
        <p className="rf3-pilot__message rf3-pilot__message--warning" role="status">
          L’état serveur ne permet pas un import sûr. Vérifiez les données avant de continuer.
        </p>
      ) : null}
      {error ? <p className="rf3-pilot__message rf3-pilot__message--error" role="alert">{error}</p> : null}

      {result ? (
        <div className="rf3-pilot__result" role="status">
          <strong>Import RF3 terminé</strong>
          <dl>
            <div><dt>Statut</dt><dd>{result.status}</dd></div>
            <div><dt>Équipe créée / réutilisée</dt><dd>{result.team_created} / {result.team_reused}</dd></div>
            <div><dt>Joueuses créées / réutilisées</dt><dd>{result.players_created} / {result.players_reused}</dd></div>
            <div><dt>Adhésions créées / réutilisées</dt><dd>{result.memberships_created} / {result.memberships_reused}</dd></div>
            <div><dt>Staff créé / réutilisé</dt><dd>{result.staff_created} / {result.staff_reused}</dd></div>
          </dl>
        </div>
      ) : null}

      <div className="rf3-pilot__actions">
        <button type="button" onClick={() => setConfirming(true)} disabled={importDisabled}>
          {locked ? 'Pilote RF3 déjà initialisé' : mutating ? 'Import en cours…' : 'Importer le pilote RF3'}
        </button>
        {!locked && precheck.state === 'inconsistent' ? (
          <button type="button" className="rf3-pilot__secondary" onClick={() => void loadPrecheck()} disabled={checking || mutating}>
            Revérifier
          </button>
        ) : null}
      </div>

      {confirming ? (
        <div className="rf3-pilot__dialog-backdrop">
          <div role="alertdialog" aria-modal="true" aria-labelledby="rf3-confirm-title" aria-describedby="rf3-confirm-description" className="rf3-pilot__dialog" onKeyDown={(event) => {
            if (event.key === 'Escape') setConfirming(false)
          }}>
            <h3 id="rf3-confirm-title">Importer les données réelles RF3 - SF 2026-2027 ?</h3>
            <p id="rf3-confirm-description">Cette opération créera au maximum :</p>
            <ul>
              <li>1 équipe</li><li>7 joueuses</li><li>7 adhésions actives</li><li>1 affectation head coach</li>
            </ul>
            <div className="rf3-pilot__dialog-actions">
              <button type="button" className="rf3-pilot__secondary" onClick={() => setConfirming(false)} autoFocus>Annuler</button>
              <button type="button" onClick={confirmImport} disabled={mutating}>Confirmer l’import</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
