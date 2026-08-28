import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../features/auth/context/AuthContext'
import { canManageTeamStaff, loadAssignableProfiles, loadTeamDetail, type StaffProfile, type TeamDetail } from '../../features/teams/teamManagementService'
import { TeamStaffPanel } from './TeamStaffPanel'
import '../../styles/teams.css'

export function TeamProfilePage() {
  const { teamId } = useParams()
  const { profile } = useAuth()
  const [team, setTeam] = useState<TeamDetail | null>(null)
  const [profiles, setProfiles] = useState<StaffProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const canManage = canManageTeamStaff(profile?.role)
  const refresh = useCallback(async () => { if (!teamId) throw new Error('Identifiant équipe manquant.'); setTeam(await loadTeamDetail(teamId)) }, [teamId])

  useEffect(() => { let alive = true; setLoading(true); Promise.all([refresh(), canManage ? loadAssignableProfiles().then((items) => alive && setProfiles(items)) : Promise.resolve()]).catch((cause) => alive && setError(cause instanceof Error ? cause.message : 'Chargement impossible.')).finally(() => alive && setLoading(false)); return () => { alive = false } }, [refresh, canManage])
  if (loading) return <main className="teams-page"><section className="team-state-card" role="status">Chargement de la fiche équipe…</section></main>
  if (error || !team) return <main className="teams-page"><section className="team-alert-card" role="alert"><h1>Fiche équipe indisponible</h1><p>{error || 'Équipe introuvable.'}</p></section></main>
  const headCoach = team.staff.find((item) => item.assignment_role === 'head_coach')
  return <main className="teams-page team-operational-profile">
    <section className="bcvb-dashboard-hero teams-profile-header"><div><p className="bcvb-eyebrow">Fiche équipe</p><h1 className="bcvb-title-xl">{team.name}</h1><p className="bcvb-subtitle">{team.category || 'Catégorie non renseignée'} · {team.level || 'Niveau non renseigné'} · {team.season || 'Saison non renseignée'}</p></div></section>
    {!headCoach && <section className="team-alert-card team-alert-card--warning" role="alert"><h2>Coach principal manquant</h2><p>Aucun coach principal actif n’est affecté à cette équipe.</p></section>}
    <section className="team-profile-layout team-profile-layout--contained"><div className="team-profile-main">
      <TeamStaffPanel team={team} profiles={profiles} canManage={canManage} actorId={profile?.id} onSaved={refresh} />
      <section className="team-table-card team-roster-card"><div className="teams-section-title"><span>Effectif lié</span><h2>Joueurs ({team.players.length})</h2></div>{team.players.length === 0 ? <p>Aucun joueur actif lié à cette équipe.</p> : <div className="team-player-grid">{team.players.map((player) => <article key={player.id}><strong>{player.first_name} {player.last_name}</strong><span>{player.category || 'Catégorie non renseignée'}</span></article>)}</div>}<Link className="bcvb-button-secondary team-touch-action" to="/effectifs">Accéder aux effectifs</Link></section>
    </div></section>
  </main>
}
export default TeamProfilePage
