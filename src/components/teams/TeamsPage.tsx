import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getTeamProfileBasePath } from '../../lib/teams/teamRoutes'
import { loadTeams, type TeamRow } from '../../features/teams/teamManagementService'
import '../../styles/teams.css'

export function TeamsPage() {
  const { pathname } = useLocation()
  const [teams, setTeams] = useState<TeamRow[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const basePath = getTeamProfileBasePath(pathname)
  useEffect(() => { let alive = true; loadTeams().then((rows) => alive && setTeams(rows)).catch((cause) => alive && setError(cause instanceof Error ? cause.message : 'Chargement impossible.')).finally(() => alive && setLoading(false)); return () => { alive = false } }, [])
  const filtered = useMemo(() => teams.filter((team) => `${team.name} ${team.category} ${team.level} ${team.season}`.toLowerCase().includes(query.trim().toLowerCase())), [teams, query])
  return <main className="teams-page bcvb-page-shell bcvb-page-shell--wide">
    <section className="bcvb-dashboard-hero teams-header"><div><p className="bcvb-eyebrow">Gestion des équipes</p><h1 className="bcvb-title-xl">Équipes et encadrement</h1><p className="bcvb-subtitle">Données actives du club, chargées depuis Supabase.</p></div></section>
    <section className="teams-filters teams-filters--compact" aria-label="Filtrer les équipes"><label><span>Rechercher</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, catégorie, niveau ou saison" /></label></section>
    {loading && <section className="team-state-card" role="status">Chargement des équipes…</section>}
    {error && <section className="team-alert-card" role="alert"><h2>Équipes indisponibles</h2><p>{error}</p></section>}
    {!loading && !error && filtered.length === 0 && <section className="team-state-card"><h2>Aucune équipe</h2><p>Aucune équipe active ne correspond à cette recherche.</p></section>}
    <section className="teams-grid teams-grid--operational">{filtered.map((team) => <article className="team-card" key={team.id}><div className="team-card__top"><span>{team.category || 'Catégorie non renseignée'}</span><strong>{team.season || 'Saison non renseignée'}</strong></div><h2>{team.name}</h2><dl><div><dt>Niveau</dt><dd>{team.level || 'Non renseigné'}</dd></div></dl><Link className="bcvb-button-primary team-touch-action" to={`${basePath}/${team.id}`}>Ouvrir la fiche</Link></article>)}</section>
  </main>
}
export default TeamsPage
