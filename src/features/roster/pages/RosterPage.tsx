import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import { loadTeams } from '../../teams/teamManagementService'
import { RosterList } from '../components/RosterList'
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
  RosterMember,
  RosterPageStatus,
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
  const teamRequestId = useRef(0)
  const rosterRequestId = useRef(0)
  const searchRequestId = useRef(0)

  const resetSearch = useCallback(() => {
    searchRequestId.current += 1
    setSearchOpen(false)
    setSearching(false)
    setSearchResult(null)
    setSearchError(null)
  }, [])

  useEffect(() => {
    const currentRequest = ++teamRequestId.current
    rosterRequestId.current += 1
    searchRequestId.current += 1
    setTeams([])
    setSelectedTeamId('')
    setMembers([])
    setCapabilities(null)
    setSearchOpen(false)
    setSearching(false)
    setSearchResult(null)
    setSearchError(null)
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
      {searchOpen && capabilities?.canSearchPlayers ? <RosterPlayerSearchPanel searching={searching} result={searchResult} errorMessage={searchError} onSearch={searchPlayers} onClose={resetSearch} /> : null}
      {status === 'READY' && selectedTeam ? <RosterList team={selectedTeam} members={members} /> : null}
      {status !== 'READY' ? <RosterStatePanel status={status} team={selectedTeam} onRetry={status === 'ERROR' ? refresh : undefined} /> : null}
      {capabilities?.canManageRoster ? <p className="sr-only">Votre profil dispose de capacités de gestion serveur.</p> : null}
    </main>
  )
}
