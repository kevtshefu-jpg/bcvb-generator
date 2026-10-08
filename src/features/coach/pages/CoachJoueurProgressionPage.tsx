import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { playerProgressionService, type PlayerProgressionProfile } from '../playerProgressionService'
import { performanceTestService, type PerformanceTestResult } from '../performanceTestService'
import { playerMonitoringService, type MonitoringSummary } from '../playerMonitoringService'
import { playerProgramService, type PlayerProgram } from '../playerProgramService'
import { buildPlayerPerformanceDashboard } from '../playerPerformanceDashboard'

function statusLabel(value: string | null, fallback: string) {
  return value?.trim() || fallback
}

export default function CoachJoueurProgressionPage() {
  const { id = '' } = useParams()
  const [profile, setProfile] = useState<PlayerProgressionProfile | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [tests, setTests] = useState<PerformanceTestResult[]>([])
  const [monitoring, setMonitoring] = useState<MonitoringSummary|null>(null)
  const [programs, setPrograms] = useState<PlayerProgram[]>([])
  const [sourceErrors, setSourceErrors] = useState<string[]>([])

  useEffect(() => {
    let active = true
    setState('loading')
    setProfile(null)
    setSourceErrors([])
    setTests([]); setMonitoring(null); setPrograms([])
    if (!id) { setState('error'); return () => { active = false } }
    void playerProgressionService.readProfile(id).then(async (next) => {
      if (!active) return
      const [nextTests, nextMonitoring, nextPrograms] = await Promise.allSettled([
        performanceTestService.readPlayer(next.playerId, next.teamId),
        playerMonitoringService.readSummary(next.playerId, next.teamId),
        playerProgramService.readPlayer(next.playerId, next.teamId),
      ])
      if (!active) return
      const errors: string[] = []
      if (nextTests.status === 'rejected') errors.push('tests physiques')
      if (nextMonitoring.status === 'rejected') errors.push('suivi charge / disponibilité')
      if (nextPrograms.status === 'rejected') errors.push('programmes')
      setSourceErrors(errors)
      setProfile(next)
      setTests(nextTests.status === 'fulfilled' ? nextTests.value : [])
      setMonitoring(nextMonitoring.status === 'fulfilled' ? nextMonitoring.value : null)
      setPrograms(nextPrograms.status === 'fulfilled' ? nextPrograms.value : [])
      setState('ready')
    }).catch(() => {
      if (active) setState('error')
    })
    return () => { active = false }
  }, [id])

  const performance = profile ? buildPlayerPerformanceDashboard(profile, tests, monitoring, programs) : null

  return (
    <main className="bcvb-page coach-tool-page" aria-busy={state === 'loading'}>
      <section className="bcvb-dashboard-hero">
        <div>
          <p className="bcvb-eyebrow">Suivi joueur</p>
          <h1 className="bcvb-title-xl">{profile ? `${profile.firstName} ${profile.lastName}` : 'Profil de progression'}</h1>
          <p className="bcvb-subtitle">Socle canonique du suivi individuel BCVB. Les informations affichées proviennent des données partagées du club et respectent les droits d’accès à l’équipe.</p>
        </div>
      </section>

      {state === 'loading' ? <section className="bcvb-tool-card" role="status"><h2>Chargement du profil…</h2></section> : null}
      {state === 'error' ? (
        <section className="bcvb-tool-card" role="alert">
          <h2>Profil indisponible</h2>
          <p>Le joueur n’existe pas, n’est plus actif ou votre profil ne permet pas d’accéder à son suivi.</p>
          <Link className="bcvb-button-secondary" to="/coach/joueurs">Retour aux joueurs</Link>
        </section>
      ) : null}

      {state === 'ready' && profile ? (
        <>
          <section className="bcvb-tool-card">
            <span className="bcvb-status-pill">Identité canonique</span>
            <h2>{profile.firstName} {profile.lastName}</h2>
            <dl className="roster-profile-list">
              <div><dt>Catégorie joueur</dt><dd>{profile.category || 'Non renseignée'}</dd></div>
              <div><dt>Équipe</dt><dd>{profile.teamName}</dd></div>
              <div><dt>Catégorie équipe</dt><dd>{profile.teamCategory}</dd></div>
              <div><dt>Saison</dt><dd>{profile.season}</dd></div>
            </dl>
          </section>

          <section className="roster-block-grid" aria-label="État du suivi joueur">
            <article className="roster-block-card"><span>Présences</span><h2>{statusLabel(profile.attendanceStatus, 'À relier')}</h2><p>Suivi collectif existant, sans donnée médicale exposée ici.</p></article>
            <article className="roster-block-card"><span>Évaluations</span><h2>{profile.evaluationCount}</h2><p>{profile.lastEvaluationDate ? `Dernière évaluation : ${profile.lastEvaluationDate}` : 'Aucune évaluation enregistrée.'}</p></article>
            <article className="roster-block-card"><span>Objectifs actifs</span><h2>{profile.activeObjectiveCount}</h2><p>{profile.activeObjectiveCount > 0 ? 'Objectifs canoniques à travailler ou en cours.' : 'Aucun objectif actif enregistré.'}</p></article>
            <article className="roster-block-card"><span>Documents</span><h2>{statusLabel(profile.documentsStatus, 'À relier')}</h2><p>Point d’entrée futur des Player Books et exports joueurs.</p></article>
          </section>

          <section className="bcvb-tool-card">
            <h2>Performance System</h2>
            {sourceErrors.length > 0 ? <p role="alert">Sources indisponibles : {sourceErrors.join(', ')}. Les valeurs correspondantes ne sont pas disponibles.</p> : null}
            {performance ? <dl className="roster-profile-list"><div><dt>Tests physiques</dt><dd>{sourceErrors.includes('tests physiques') ? 'Indisponible' : performance.testCount}{!sourceErrors.includes('tests physiques') && performance.lastTestDate ? ` · dernier : ${performance.lastTestDate}` : ''}</dd></div><div><dt>Suivis charge / disponibilité</dt><dd>{sourceErrors.includes('suivi charge / disponibilité') ? 'Indisponible' : performance.monitoringCount}{!sourceErrors.includes('suivi charge / disponibilité') && performance.lastMonitoringDate ? ` · dernier : ${performance.lastMonitoringDate}` : ''}</dd></div><div><dt>Programmes</dt><dd>{sourceErrors.includes('programmes') ? 'Indisponible' : `${performance.activeProgramCount} actif(s) · ${performance.programCount} total`}</dd></div></dl> : null}<p>Les indicateurs ci-dessus sont factuels. Aucun score de performance, diagnostic ou norme physique n’est déduit automatiquement.</p>
          </section>
        </>
      ) : null}
    </main>
  )
}
