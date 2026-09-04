import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import { loadTeams } from '../../teams/teamManagementService'
import { RosterList } from '../components/RosterList'
import { RosterStatePanel } from '../components/RosterStatePanel'
import { RosterTeamSelector } from '../components/RosterTeamSelector'
import { RosterReadError, rosterReadService, type RosterReadService } from '../rosterReadService'
import type { RosterCapabilities, RosterMember, RosterPageStatus, RosterTeam } from '../rosterModels'
import './RosterPage.css'

export type RosterPageProps = {
  loadTeamOptions?: () => Promise<RosterTeam[]>
  service?: RosterReadService
}

export default function RosterPage({ loadTeamOptions = loadTeams, service = rosterReadService }: RosterPageProps) {
  const { profile } = useAuth()
  const [teams, setTeams] = useState<RosterTeam[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [members, setMembers] = useState<RosterMember[]>([])
  const [capabilities, setCapabilities] = useState<RosterCapabilities | null>(null)
  const [status, setStatus] = useState<RosterPageStatus>('LOADING')
  const [teamLoadVersion, setTeamLoadVersion] = useState(0)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const requestId = useRef(0)

  useEffect(() => {
    const currentRequest = ++requestId.current
    setTeams([])
    setSelectedTeamId('')
    setMembers([])
    setCapabilities(null)
    setStatus('LOADING')
    void loadTeamOptions().then((nextTeams) => {
      if (currentRequest !== requestId.current) return
      setTeams(nextTeams)
      setSelectedTeamId((current) => nextTeams.some((team) => team.id === current) ? current : nextTeams[0]?.id ?? '')
      if (nextTeams.length === 0) setStatus('NO_TEAM_AVAILABLE')
    }).catch(() => {
      if (currentRequest === requestId.current) setStatus('ERROR')
    })
    return () => { requestId.current += 1 }
  }, [loadTeamOptions, profile?.id, teamLoadVersion])

  useEffect(() => {
    if (!selectedTeamId) return
    const currentRequest = ++requestId.current
    setMembers([])
    setCapabilities(null)
    setStatus('LOADING')
    void service.getCapabilities(selectedTeamId).then(async (nextCapabilities) => {
      if (currentRequest !== requestId.current) return
      setCapabilities(nextCapabilities)
      if (!nextCapabilities.canViewRoster) {
        setStatus('FORBIDDEN')
        return
      }
      const nextMembers = await service.readTeamRoster(selectedTeamId)
      if (currentRequest !== requestId.current) return
      if (nextMembers.some((member) => member.teamId !== selectedTeamId)) throw new Error('MALFORMED_ROSTER_RESPONSE')
      setMembers(nextMembers)
      setStatus(nextMembers.length === 0 ? 'EMPTY' : 'READY')
    }).catch((error: unknown) => {
      if (currentRequest !== requestId.current) return
      setMembers([])
      setStatus(error instanceof RosterReadError && error.kind === 'FORBIDDEN' ? 'FORBIDDEN' : 'ERROR')
    })
    return () => { requestId.current += 1 }
  }, [refreshVersion, selectedTeamId, service, profile?.id])

  const selectTeam = useCallback((teamId: string) => {
    if (teamId === selectedTeamId) return
    requestId.current += 1
    setMembers([])
    setCapabilities(null)
    setStatus('LOADING')
    setSelectedTeamId(teamId)
  }, [selectedTeamId])

  const selectedTeam = teams.find((team) => team.id === selectedTeamId)
  const refresh = useCallback(() => {
    if (selectedTeamId) setRefreshVersion((value) => value + 1)
    else setTeamLoadVersion((value) => value + 1)
  }, [selectedTeamId])

  return (
    <main className="bcvb-page roster-read-page" aria-busy={status === 'LOADING'}>
      <header className="bcvb-dashboard-hero roster-read-hero">
        <div><p className="bcvb-eyebrow">Effectifs</p><h1 className="bcvb-title-xl">Effectif de l’équipe</h1><p className="bcvb-subtitle">Lecture des joueurs et appartenances enregistrés dans la base partagée du club.</p></div>
        <button type="button" aria-label="Actualiser l’effectif" disabled={status === 'LOADING'} onClick={refresh}>Actualiser</button>
      </header>

      {teams.length > 0 ? <RosterTeamSelector teams={teams} selectedTeamId={selectedTeamId} disabled={status === 'LOADING'} onChange={selectTeam} /> : null}
      {status === 'READY' && selectedTeam ? <RosterList team={selectedTeam} members={members} /> : null}
      {status !== 'READY' ? <RosterStatePanel status={status} team={selectedTeam} onRetry={status === 'ERROR' ? refresh : undefined} /> : null}
      {capabilities?.canManageRoster ? <p className="sr-only">Votre profil dispose de capacités de gestion serveur, non activées dans cette vue en lecture seule.</p> : null}
    </main>
  )
}
