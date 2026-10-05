import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import { loadTeams } from '../../teams/teamManagementService'
import { RosterList } from '../components/RosterList'
import { RosterMembershipConfirmPanel } from '../components/RosterMembershipConfirmPanel'
import { RosterMembershipDeactivatePanel } from '../components/RosterMembershipDeactivatePanel'
import { RosterPlayerCreatePanel } from '../components/RosterPlayerCreatePanel'
import { RosterPlayerSearchPanel } from '../components/RosterPlayerSearchPanel'
import { RosterStatePanel } from '../components/RosterStatePanel'
import { RosterTeamSelector } from '../components/RosterTeamSelector'
import {
  RosterManagementError,
  rosterManagementService,
  type RosterManagementService,
} from '../rosterManagementService'
import { RosterReadError, rosterReadService, type RosterReadService } from '../rosterReadService'
import type {
  RosterCapabilities,
  RosterCreateResult,
  RosterMember,
  RosterPageStatus,
  RosterSearchCandidate,
  RosterSearchInput,
  RosterSearchResult,
  RosterTeam,
} from '../rosterModels'
import './RosterPage.css'

export type RosterPageProps = {
  loadTeamOptions?: () => Promise<RosterTeam[]>
  service?: RosterReadService
  managementService?: RosterManagementService
}

export default function RosterPage({
  loadTeamOptions = loadTeams,
  service = rosterReadService,
  managementService = rosterManagementService,
}: RosterPageProps) {
  const { profile } = useAuth()
  const [teams, setTeams] = useState<RosterTeam[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [members, setMembers] = useState<RosterMember[]>([])
  const [capabilities, setCapabilities] = useState<RosterCapabilities | null>(null)
  const [status, setStatus] = useState<RosterPageStatus>('LOADING')
  const [teamLoadVersion, setTeamLoadVersion] = useState(0)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<RosterSearchResult | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<RosterSearchCandidate | null>(null)
  const [createDraft, setCreateDraft] = useState<{ input: RosterSearchInput; candidates: RosterSearchCandidate[] } | null>(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createdIdentity, setCreatedIdentity] = useState<{ playerId: string; firstName: string; lastName: string; replay: boolean } | null>(null)
  const [membershipCandidate, setMembershipCandidate] = useState<{ playerId: string; firstName: string; lastName: string } | null>(null)
  const [membershipSubmitting, setMembershipSubmitting] = useState(false)
  const [membershipError, setMembershipError] = useState<string | null>(null)
  const [membershipSuccess, setMembershipSuccess] = useState<string | null>(null)
  const [deactivateCandidate, setDeactivateCandidate] = useState<RosterMember | null>(null)
  const [deactivateSubmitting, setDeactivateSubmitting] = useState(false)
  const [deactivateError, setDeactivateError] = useState<string | null>(null)
  const [deactivateSuccess, setDeactivateSuccess] = useState<string | null>(null)
  const teamRequestId = useRef(0)
  const rosterRequestId = useRef(0)
  const searchRequestId = useRef(0)
  const createRequestId = useRef(0)
  const membershipRequestId = useRef(0)
  const deactivateRequestId = useRef(0)
  const createOperationId = useRef<string | null>(null)

  const resetSearch = useCallback(() => {
    searchRequestId.current += 1
    membershipRequestId.current += 1
    deactivateRequestId.current += 1
    createRequestId.current += 1
    createOperationId.current = null
    setSearchOpen(false)
    setSearching(false)
    setSearchResult(null)
    setSearchError(null)
    setSelectedCandidate(null)
    createRequestId.current += 1
    createOperationId.current = null
    setCreateDraft(null)
    setCreating(false)
    setCreateError(null)
    setCreatedIdentity(null)
    setMembershipCandidate(null)
    setMembershipSubmitting(false)
    setMembershipError(null)
    setMembershipSuccess(null)
  }, [])

  useEffect(() => {
    const currentRequest = ++teamRequestId.current
    rosterRequestId.current += 1
    searchRequestId.current += 1
    createRequestId.current += 1
    membershipRequestId.current += 1
    deactivateRequestId.current += 1
    createOperationId.current = null
    setTeams([])
    setSelectedTeamId('')
    setMembers([])
    setCapabilities(null)
    setSearchOpen(false)
    setSearching(false)
    setSearchResult(null)
    setSearchError(null)
    setSelectedCandidate(null)
    setCreateDraft(null)
    setCreating(false)
    setCreateError(null)
    setCreatedIdentity(null)
    setMembershipCandidate(null)
    setMembershipSubmitting(false)
    setMembershipError(null)
    setMembershipSuccess(null)
    setDeactivateCandidate(null)
    setDeactivateSubmitting(false)
    setDeactivateError(null)
    setDeactivateSuccess(null)
    setStatus('LOADING')
    void loadTeamOptions().then((nextTeams) => {
      if (currentRequest !== teamRequestId.current) return
      setTeams(nextTeams)
      setSelectedTeamId((current) => nextTeams.some((team) => team.id === current) ? current : nextTeams[0]?.id ?? '')
      if (nextTeams.length === 0) setStatus('NO_TEAM_AVAILABLE')
    }).catch(() => {
      if (currentRequest === teamRequestId.current) setStatus('ERROR')
    })
    return () => {
      teamRequestId.current += 1
      rosterRequestId.current += 1
      searchRequestId.current += 1
      createRequestId.current += 1
      membershipRequestId.current += 1
      deactivateRequestId.current += 1
      createOperationId.current = null
    }
  }, [loadTeamOptions, profile?.id, teamLoadVersion])

  useEffect(() => {
    if (!selectedTeamId) return
    const currentRequest = ++rosterRequestId.current
    setMembers([])
    setCapabilities(null)
    setStatus('LOADING')
    void service.getCapabilities(selectedTeamId).then(async (nextCapabilities) => {
      if (currentRequest !== rosterRequestId.current) return
      setCapabilities(nextCapabilities)
      if (!nextCapabilities.canSearchPlayers) resetSearch()
      if (!nextCapabilities.canViewRoster) {
        setStatus('FORBIDDEN')
        return
      }
      const nextMembers = await service.readTeamRoster(selectedTeamId)
      if (currentRequest !== rosterRequestId.current) return
      if (nextMembers.some((member) => member.teamId !== selectedTeamId)) throw new Error('MALFORMED_ROSTER_RESPONSE')
      setMembers(nextMembers)
      setStatus(nextMembers.length === 0 ? 'EMPTY' : 'READY')
    }).catch((error: unknown) => {
      if (currentRequest !== rosterRequestId.current) return
      setMembers([])
      setStatus(error instanceof RosterReadError && error.kind === 'FORBIDDEN' ? 'FORBIDDEN' : 'ERROR')
    })
    return () => { rosterRequestId.current += 1 }
  }, [refreshVersion, resetSearch, selectedTeamId, service])

  const selectTeam = useCallback((teamId: string) => {
    if (teamId === selectedTeamId) return
    rosterRequestId.current += 1
    resetSearch()
    setMembers([])
    setCapabilities(null)
    setStatus('LOADING')
    setSelectedTeamId(teamId)
  }, [resetSearch, selectedTeamId])

  const selectedTeam = teams.find((team) => team.id === selectedTeamId)
  const refresh = useCallback(() => {
    resetSearch()
    if (selectedTeamId) setRefreshVersion((value) => value + 1)
    else setTeamLoadVersion((value) => value + 1)
  }, [resetSearch, selectedTeamId])

  const searchPlayers = useCallback(async (input: RosterSearchInput) => {
    if (!capabilities?.canSearchPlayers) {
      setSearchError('Votre profil ne permet pas cette recherche.')
      return
    }
    const currentRequest = ++searchRequestId.current
    setSearching(true)
    setSearchResult(null)
    setSearchError(null)
    setSelectedCandidate(null)
    setCreateDraft(null)
    setCreating(false)
    setCreateError(null)
    setCreatedIdentity(null)
    setMembershipCandidate(null)
    setMembershipSubmitting(false)
    setMembershipError(null)
    setMembershipSuccess(null)
    try {
      const result = await managementService.searchPlayers(input)
      if (currentRequest !== searchRequestId.current) return
      setSearchResult(result)
    } catch (error: unknown) {
      if (currentRequest !== searchRequestId.current) return
      if (error instanceof RosterManagementError && error.kind === 'VALIDATION') {
        setSearchError('Renseignez un numéro de licence ou le prénom et le nom.')
      } else if (error instanceof RosterManagementError && error.kind === 'FORBIDDEN') {
        setSearchError('Votre profil ne permet pas cette recherche.')
      } else {
        setSearchError('La recherche est momentanément indisponible. Réessayez.')
      }
    } finally {
      if (currentRequest === searchRequestId.current) setSearching(false)
    }
  }, [capabilities?.canSearchPlayers, managementService])

  const selectCandidate = useCallback((candidate: RosterSearchCandidate) => {
    if (!capabilities?.canAddMembership || candidate.archived) return
    setSelectedCandidate(candidate)
  }, [capabilities?.canAddMembership])

  const requestCreate = useCallback((input: RosterSearchInput, candidates: RosterSearchCandidate[]) => {
    if (!capabilities?.canCreatePlayer) return
    if (searchResult?.matchState !== 'NO_MATCH' && searchResult?.matchState !== 'AMBIGUOUS') return
    if (searchResult.matchState === 'AMBIGUOUS' && candidates.length === 0) return
    setSelectedCandidate(null)
    setCreateError(null)
    setCreatedIdentity(null)
    setMembershipCandidate(null)
    setMembershipSubmitting(false)
    setMembershipError(null)
    setMembershipSuccess(null)
    createRequestId.current += 1
    createOperationId.current = crypto.randomUUID()
    setCreateDraft({ input, candidates })
  }, [capabilities?.canCreatePlayer, searchResult])

  const createPlayer = useCallback(async (reason: string) => {
    if (!capabilities?.canCreatePlayer || !createDraft || creating) return
    const operationId = createOperationId.current
    if (!operationId) return
    const currentRequest = ++createRequestId.current
    setCreating(true)
    setCreateError(null)
    try {
      const result: RosterCreateResult = await managementService.createPlayer({
        operationId,
        firstName: createDraft.input.firstName,
        lastName: createDraft.input.lastName,
        birthDate: createDraft.input.birthDate,
        licenseNumber: createDraft.input.licenseNumber,
        confirmDistinctPerson: createDraft.candidates.length > 0,
        acknowledgedCandidateIds: createDraft.candidates.map((candidate) => candidate.playerId),
        distinctPersonReason: reason,
      })
      if (currentRequest !== createRequestId.current) return
      if (result.status !== 'CREATED' || !result.playerId) {
        setCreateError('La création a été interrompue car l’identité doit être vérifiée à nouveau.')
        return
      }
      setCreatedIdentity({
        playerId: result.playerId,
        firstName: createDraft.input.firstName.trim(),
        lastName: createDraft.input.lastName.trim(),
        replay: result.idempotentReplay,
      })
      setCreateDraft(null)
      setSearchResult(null)
    } catch (error: unknown) {
      if (currentRequest !== createRequestId.current) return
      if (error instanceof RosterManagementError && error.kind === 'FORBIDDEN') setCreateError('Votre profil ne permet pas cette création.')
      else if (error instanceof RosterManagementError && (error.kind === 'VALIDATION' || error.kind === 'NOT_FOUND')) setCreateError('Les informations de création doivent être vérifiées.')
      else setCreateError('La création est momentanément indisponible. Relancez d’abord la recherche avant de réessayer.')
    } finally {
      if (currentRequest === createRequestId.current) setCreating(false)
    }
  }, [capabilities?.canCreatePlayer, createDraft, creating, managementService])

  const requestMembership = useCallback((candidate: { playerId: string; firstName: string; lastName: string }) => {
    if (!capabilities?.canAddMembership || !selectedTeam) return
    setMembershipError(null)
    setMembershipSuccess(null)
    setMembershipCandidate(candidate)
  }, [capabilities?.canAddMembership, selectedTeam])

  const confirmMembership = useCallback(async () => {
    if (!capabilities?.canAddMembership || !selectedTeam || !membershipCandidate || membershipSubmitting) return
    const currentRequest = ++membershipRequestId.current
    const targetTeamId = selectedTeam.id
    const targetSeason = selectedTeam.season
    setMembershipSubmitting(true)
    setMembershipError(null)
    try {
      const result = await managementService.addOrReactivateMembership({
        playerId: membershipCandidate.playerId,
        teamId: targetTeamId,
        season: targetSeason,
      })
      if (currentRequest !== membershipRequestId.current) return
      setMembershipSuccess(result.changed ? 'Appartenance enregistrée dans l’effectif.' : 'Ce joueur était déjà actif dans cet effectif.')
      setMembershipCandidate(null)
      setSelectedCandidate(null)
      setCreatedIdentity(null)
      const nextMembers = await service.readTeamRoster(targetTeamId)
      if (currentRequest !== membershipRequestId.current) return
      if (nextMembers.some((member) => member.teamId !== targetTeamId)) throw new Error('MALFORMED_ROSTER_RESPONSE')
      setMembers(nextMembers)
      setStatus(nextMembers.length === 0 ? 'EMPTY' : 'READY')
    } catch (error: unknown) {
      if (currentRequest !== membershipRequestId.current) return
      if (error instanceof RosterManagementError && error.kind === 'FORBIDDEN') setMembershipError('Votre profil ne permet pas de modifier cet effectif.')
      else if (error instanceof RosterManagementError && error.kind === 'VALIDATION') setMembershipError('L’équipe, la saison ou le joueur doit être vérifié.')
      else setMembershipError('L’ajout à l’effectif est momentanément indisponible. Réessayez.')
    } finally {
      if (currentRequest === membershipRequestId.current) setMembershipSubmitting(false)
    }
  }, [capabilities?.canAddMembership, managementService, membershipCandidate, membershipSubmitting, selectedTeam, selectedTeamId, service])

  const confirmDeactivate = useCallback(async () => {
    if (!capabilities?.canDeactivateMembership || !selectedTeam || !deactivateCandidate || deactivateSubmitting) return
    const currentRequest = ++deactivateRequestId.current
    const targetTeamId = selectedTeam.id
    const targetMembershipId = deactivateCandidate.membershipId
    setDeactivateSubmitting(true)
    setDeactivateError(null)
    try {
      const result = await managementService.deactivateMembership(targetMembershipId)
      if (currentRequest !== deactivateRequestId.current) return
      setDeactivateSuccess(result.changed ? 'Le joueur a été retiré de cet effectif.' : 'Cette appartenance était déjà inactive.')
      setDeactivateCandidate(null)
      const nextMembers = await service.readTeamRoster(targetTeamId)
      if (currentRequest !== membershipRequestId.current) return
      if (nextMembers.some((member) => member.teamId !== targetTeamId)) throw new Error('MALFORMED_ROSTER_RESPONSE')
      setMembers(nextMembers)
      setStatus(nextMembers.length === 0 ? 'EMPTY' : 'READY')
    } catch (error: unknown) {
      if (currentRequest !== deactivateRequestId.current) return
      if (error instanceof RosterManagementError && error.kind === 'FORBIDDEN') setDeactivateError('Votre profil ne permet pas de modifier cet effectif.')
      else if (error instanceof RosterManagementError && (error.kind === 'VALIDATION' || error.kind === 'NOT_FOUND')) setDeactivateError('Cette appartenance doit être vérifiée ou n’existe plus.')
      else setDeactivateError('Le retrait de l’effectif est momentanément indisponible. Réessayez.')
    } finally { if (currentRequest === deactivateRequestId.current) setDeactivateSubmitting(false) }
  }, [capabilities?.canDeactivateMembership, deactivateCandidate, deactivateSubmitting, managementService, selectedTeam, selectedTeamId, service])

  const rosterVisible = status === 'READY' || status === 'EMPTY'

  return (
    <main className="bcvb-page roster-read-page" aria-busy={status === 'LOADING'}>
      <header className="bcvb-dashboard-hero roster-read-hero">
        <div><p className="bcvb-eyebrow">Effectifs</p><h1 className="bcvb-title-xl">Effectif de l’équipe</h1><p className="bcvb-subtitle">Lecture des joueurs et appartenances enregistrés dans la base partagée du club.</p></div>
        <div className="roster-hero-actions">
          {rosterVisible && capabilities?.canSearchPlayers ? <button type="button" onClick={() => { setSearchOpen(true); setSearchResult(null); setSearchError(null) }}>+ Ajouter un joueur</button> : null}
          <button type="button" aria-label="Actualiser l’effectif" disabled={status === 'LOADING'} onClick={refresh}>Actualiser</button>
        </div>
      </header>

      {teams.length > 0 ? <RosterTeamSelector teams={teams} selectedTeamId={selectedTeamId} disabled={status === 'LOADING'} onChange={selectTeam} /> : null}
      {searchOpen && capabilities?.canSearchPlayers ? (
        <RosterPlayerSearchPanel
          searching={searching}
          result={searchResult}
          errorMessage={searchError}
          onSearch={searchPlayers}
          canSelectCandidate={capabilities.canAddMembership}
          selectedPlayerId={selectedCandidate?.playerId ?? null}
          onSelectCandidate={selectCandidate}
          canCreatePlayer={capabilities.canCreatePlayer}
          onRequestCreate={requestCreate}
          onClose={resetSearch}
        />
      ) : null}
      {searchOpen && createDraft ? (
        <RosterPlayerCreatePanel
          input={createDraft.input}
          candidates={createDraft.candidates}
          creating={creating}
          errorMessage={createError}
          onCreate={createPlayer}
          onCancel={() => { createRequestId.current += 1; createOperationId.current = null; setCreateDraft(null); setCreating(false); setCreateError(null) }}
        />
      ) : null}
      {searchOpen && createdIdentity ? (
        <section className="roster-read-card roster-created-identity" role="status">
          <p className="bcvb-eyebrow">Identité créée</p>
          <h2>{createdIdentity.firstName} {createdIdentity.lastName}</h2>
          <p>L’identité canonique est enregistrée. Elle n’a pas été ajoutée automatiquement à l’effectif.</p>
          {capabilities?.canAddMembership && selectedTeam ? <button type="button" onClick={() => requestMembership(createdIdentity)}>Ajouter à {selectedTeam.name}</button> : null}
        </section>
      ) : null}
      {searchOpen && selectedCandidate ? (
        <section className="roster-read-card roster-selected-identity" aria-live="polite">
          <p className="bcvb-eyebrow">Identité sélectionnée</p>
          <h2>{selectedCandidate.firstName} {selectedCandidate.lastName}</h2>
          <p>
            {selectedCandidate.activeMemberships.length > 0
              ? `Équipe(s) active(s) : ${selectedCandidate.activeMemberships.map((membership) => `${membership.teamName} — ${membership.season}`).join(', ')}.`
              : 'Aucune appartenance active enregistrée.'}
          </p>
          <p>La sélection ne modifie pas l’effectif.</p>
          {capabilities?.canAddMembership && selectedTeam ? <button type="button" onClick={() => requestMembership(selectedCandidate)}>Ajouter à {selectedTeam.name}</button> : null}
        </section>
      ) : null}
      {searchOpen && membershipCandidate && selectedTeam ? (
        <RosterMembershipConfirmPanel
          firstName={membershipCandidate.firstName}
          lastName={membershipCandidate.lastName}
          teamName={selectedTeam.name}
          season={selectedTeam.season}
          submitting={membershipSubmitting}
          errorMessage={membershipError}
          onConfirm={confirmMembership}
          onCancel={() => { membershipRequestId.current += 1; setMembershipCandidate(null); setMembershipSubmitting(false); setMembershipError(null) }}
        />
      ) : null}
      {searchOpen && membershipSuccess ? <p className="roster-read-card" role="status">{membershipSuccess}</p> : null}
      {deactivateCandidate && selectedTeam ? <RosterMembershipDeactivatePanel member={deactivateCandidate} team={selectedTeam} submitting={deactivateSubmitting} errorMessage={deactivateError} onConfirm={confirmDeactivate} onCancel={() => { deactivateRequestId.current += 1; setDeactivateCandidate(null); setDeactivateSubmitting(false); setDeactivateError(null) }} /> : null}
      {deactivateSuccess ? <p className="roster-read-card" role="status">{deactivateSuccess}</p> : null}
      {status === 'READY' && selectedTeam ? <RosterList team={selectedTeam} members={members} canDeactivate={Boolean(capabilities?.canDeactivateMembership)} onRequestDeactivate={(member) => { setDeactivateSuccess(null); setDeactivateError(null); setDeactivateCandidate(member) }} /> : null}
      {status !== 'READY' ? <RosterStatePanel status={status} team={selectedTeam} onRetry={status === 'ERROR' ? refresh : undefined} /> : null}
      {capabilities?.canManageRoster ? <p className="sr-only">Votre profil dispose de capacités de gestion serveur.</p> : null}
    </main>
  )
}
