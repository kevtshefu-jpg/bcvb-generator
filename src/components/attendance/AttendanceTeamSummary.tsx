import type { AttendanceTeamStats } from "../../types/attendance";

export function AttendanceTeamSummary({ stats }: { stats: AttendanceTeamStats }) {
  return (
    <section className="attendance-card attendance-team-summary">
      <div className="attendance-section-title">
        <span>Bilan équipe</span>
        <h2>{stats.attendanceRate}% présence</h2>
      </div>
      <div className="attendance-stat-grid">
        <span>Séances <strong>{stats.totalSessions}</strong></span>
        <span>Joueurs <strong>{stats.playerCount}</strong></span>
        <span>Présents <strong>{stats.presentCount}</strong></span>
        <span>Non excusés <strong>{stats.absentUnexcusedCount}</strong></span>
        <span>Retards <strong>{stats.lateCount}</strong></span>
        <span>Alertes <strong>{stats.alertCount}</strong></span>
      </div>
    </section>
  );
}

