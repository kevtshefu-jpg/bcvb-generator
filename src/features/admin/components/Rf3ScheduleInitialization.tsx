import { useCallback, useEffect, useRef, useState } from 'react'

import { isAdmin } from '../../../config/roles'
import { useAuth } from '../../auth/context/AuthContext'
import {
  rf3ScheduleInitializationService,
  type ApprovedSlotKey,
  type Rf3SchedulePrecheck,
  type Rf3ScheduleState,
} from '../services/rf3ScheduleInitializationService'
import './Rf3PilotInitialization.css'

const emptyPrecheck: Rf3SchedulePrecheck = {
  state: 'ERROR',
  teamCount: 0,
  playerCount: 0,
  membershipCount: 0,
  activeHeadCoachCount: 0,
  exactWednesdayCount: 0,
  exactFridayCount: 0,
  unexpectedRf3SlotCount: 0,
  facilityConflictCount: 0,
}

const stateLabels: Record<Rf3ScheduleState, string> = {
  READY: 'Prêt',
  ALREADY_INITIALIZED: 'Initialisé',
  PARTIAL: 'Revue humaine requise',
  CONFLICT: 'Conflit',
  ERROR: 'Indisponible',
}

function slotLabel(slot: ApprovedSlotKey) {
  return slot === 'wednesday' ? 'mercredi à Bointon' : 'vendredi au Palais'
}

export default function Rf3ScheduleInitialization() {
  const { session, profile } = useAuth()
  const [precheck, setPrecheck] = useState<Rf3SchedulePrecheck>(emptyPrecheck)
  const [checking, setChecking] = useState(true)
  const [mutating, setMutating] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const mutationInFlight = useRef(false)

  const authorized = Boolean(
    session &&
      profile?.is_active === true &&
      profile.profile_status === 'active' &&
      isAdmin(profile.role),
  )

  const loadPrecheck = useCallback(async (preserveError = false) => {
    if (!authorized) return emptyPrecheck
    setChecking(true)
    if (!preserveError) setError(null)
    try {
      const result = await rf3ScheduleInitializationService.precheck()
      setPrecheck(result)
      return result
    } catch {
      setPrecheck(emptyPrecheck)
      setError('Le contrôle du planning RF3 est indisponible. Aucun créneau ne peut être créé.')
      return emptyPrecheck
    } finally {
      setChecking(false)
    }
  }, [authorized])

  useEffect(() => {
    void loadPrecheck()
  }, [loadPrecheck])

  if (!authorized) return null

  const initializeDisabled = checking || mutating || precheck.state !== 'READY'

  async function confirmCreation() {
    if (mutationInFlight.current || initializeDisabled) return
    mutationInFlight.current = true
    setMutating(true)
    setConfirming(false)
    setMessage(null)
    setError(null)

    try {
      const writeResult = await rf3ScheduleInitializationService.createApprovedSchedule()
      if (writeResult.status === 'FIRST_FAILED') {
        setError(`Création interrompue avant le créneau du ${slotLabel(writeResult.failed)}. Aucun nouvel essai automatique.`)
        await loadPrecheck(true)
        return
      }
      if (writeResult.status === 'PARTIAL') {
        setPrecheck((current) => ({ ...current, state: 'PARTIAL', exactWednesdayCount: 1, exactFridayCount: 0 }))
        setError(`PARTIAL — REVUE HUMAINE REQUISE. Le créneau du ${slotLabel(writeResult.created[0])} existe ; celui du ${slotLabel(writeResult.failed)} manque.`)
        return
      }

      const finalState = await loadPrecheck()
      if (finalState.state === 'ALREADY_INITIALIZED') {
        setMessage('Planning RF3 initialisé')
      } else {
        setError('Les deux créations ont répondu avec succès, mais le contrôle final ne correspond pas à l’état attendu. Ne relancez pas l’action.')
      }
    } catch {
      setError('La création du planning RF3 a échoué. Aucun nouvel essai automatique n’a été effectué.')
      await loadPrecheck(true)
    } finally {
      mutationInFlight.current = false
      setMutating(false)
    }
  }

  return (
    <section className="rf3-pilot" aria-labelledby="rf3-schedule-title">
      <div className="rf3-pilot__heading">
        <div>
          <p className="rf3-pilot__eyebrow">Outil Admin isolé</p>
          <h2 id="rf3-schedule-title">Planning pilote RF3</h2>
        </div>
        <span className={`rf3-pilot__status rf3-pilot__status--${precheck.state.toLowerCase()}`}>
          {checking ? 'Vérification…' : stateLabels[precheck.state]}
        </span>
      </div>

      <dl className="rf3-pilot__summary rf3-pilot__summary--schedule">
        <div><dt>Équipe</dt><dd>RF3 - SF</dd></div>
        <div><dt>Saison</dt><dd>2026-2027</dd></div>
        <div><dt>Mercredi</dt><dd>20:30–22:00 · Bointon</dd></div>
        <div><dt>Vendredi</dt><dd>20:30–22:00 · Palais</dd></div>
        <div><dt>Validité</dt><dd>À partir du 31/08/2026 · sans date de fin</dd></div>
      </dl>

      {!checking && precheck.state === 'PARTIAL' ? (
        <p className="rf3-pilot__message rf3-pilot__message--warning" role="alert">
          PARTIAL — REVUE HUMAINE REQUISE. Un seul des deux créneaux approuvés existe. Aucune création complémentaire automatique n’est autorisée.
        </p>
      ) : null}
      {!checking && precheck.state === 'CONFLICT' ? (
        <p className="rf3-pilot__message rf3-pilot__message--warning" role="alert">
          Un conflit, un doublon ou un créneau RF3 inattendu bloque l’initialisation.
        </p>
      ) : null}
      {!checking && precheck.state === 'ERROR' && !error ? (
        <p className="rf3-pilot__message rf3-pilot__message--error" role="alert">
          L’intégrité attendue ou le précheck serveur n’est pas confirmé. Action verrouillée.
        </p>
      ) : null}
      {error ? <p className="rf3-pilot__message rf3-pilot__message--error" role="alert">{error}</p> : null}
      {message ? <p className="rf3-pilot__result" role="status"><strong>{message}</strong></p> : null}

      <div className="rf3-pilot__actions">
        <button type="button" onClick={() => setConfirming(true)} disabled={initializeDisabled}>
          {precheck.state === 'ALREADY_INITIALIZED' || message
            ? 'Planning RF3 déjà initialisé'
            : mutating
              ? 'Création en cours…'
              : 'Créer les 2 créneaux RF3'}
        </button>
        {precheck.state !== 'ALREADY_INITIALIZED' && precheck.state !== 'READY' ? (
          <button type="button" className="rf3-pilot__secondary" onClick={() => void loadPrecheck()} disabled={checking || mutating}>
            Revérifier
          </button>
        ) : null}
      </div>

      {confirming ? (
        <div className="rf3-pilot__dialog-backdrop">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="rf3-schedule-confirm-title"
            aria-describedby="rf3-schedule-confirm-description"
            className="rf3-pilot__dialog"
            onKeyDown={(event) => {
              if (event.key === 'Escape' && !mutating) setConfirming(false)
            }}
          >
            <h3 id="rf3-schedule-confirm-title">Créer les deux créneaux réels RF3 ?</h3>
            <div id="rf3-schedule-confirm-description">
              <p>Créer :</p>
              <ul>
                <li>Mercredi 20h30–22h00 — Bointon</li>
                <li>Vendredi 20h30–22h00 — Palais</li>
              </ul>
              <p><strong>Début :</strong> 31/08/2026</p>
              <p><strong>Fin :</strong> sans date de fin</p>
            </div>
            <div className="rf3-pilot__dialog-actions">
              <button type="button" className="rf3-pilot__secondary" onClick={() => setConfirming(false)} disabled={mutating} autoFocus>Annuler</button>
              <button type="button" onClick={confirmCreation} disabled={mutating}>Confirmer la création des 2 créneaux</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
