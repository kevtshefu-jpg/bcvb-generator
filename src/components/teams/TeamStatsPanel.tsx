import type { TeamIndicators, TeamStats } from "../../types/teams";

export function TeamStatsPanel({
  stats,
  indicators,
  canViewEvaluations,
}: {
  stats: TeamStats;
  indicators: TeamIndicators;
  canViewEvaluations: boolean;
}) {
  return (
    <section className="team-stats-panel">
      <div className="teams-section-title">
        <span>Statistiques</span>
        <h2>Indicateurs sportifs</h2>
      </div>
      <div className="team-stat-grid">
        <article><span>Joueurs</span><strong>{stats.playersCount}</strong></article>
        <article><span>Staff actif</span><strong>{stats.staffCount}</strong></article>
        <article><span>Séances</span><strong>{stats.sessionsCount}</strong></article>
        <article><span>Présence</span><strong>{stats.attendanceRate ?? indicators.averageAttendanceRate}%</strong></article>
        <article><span>Objectifs actifs</span><strong>{stats.activeObjectivesCount}</strong></article>
        <article><span>Objectifs atteints</span><strong>{stats.reachedObjectivesCount ?? 0}</strong></article>
        <article><span>Documents</span><strong>{stats.documentsCount}</strong></article>
        <article><span>Progression</span><strong>{stats.averageProgression ?? indicators.objectivesProgressRate}%</strong></article>
        {canViewEvaluations && <article><span>Évaluations</span><strong>{stats.evaluationsCount ?? indicators.evaluationsCompleted}</strong></article>}
      </div>
      {!canViewEvaluations && <p className="team-muted-note">Les évaluations techniques sont masquées pour ce profil.</p>}
    </section>
  );
}

