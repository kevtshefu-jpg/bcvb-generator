import type { AttendanceTeamStats } from "../../types/attendance";

export function AttendanceTeamSummary({ stats }: { stats: AttendanceTeamStats }) {
  return (
    <section className="attendance-card attendance-team-summary">
      <div className="attendance-section-title">
        <span>Bilan équipe</span>
        <h2>
          Présence : {stats.attendanceRate === null ? (
            <span
              aria-label="Taux de présence non calculable : aucun relevé renseigné"
              title="Taux de présence non calculable : aucun relevé renseigné"
            >—</span>
          ) : `${stats.attendanceRate}%`}
        </h2>
      </div>
      <div className="attendance-stat-grid">
        <span>Séances <strong>{stats.totalSessions}</strong></span>
        <span>Joueurs <strong>{stats.playerCount}</strong></span>
        <span>Non renseignés <strong>{stats.missingRecords}</strong></span>
        <span>Complétude <strong>{stats.completionRate}%</strong></span>
        <span>Présents <strong>{stats.presentCount}</strong></span>
        <span>Non excusés <strong>{stats.absentUnexcusedCount}</strong></span>
        <span>Retards <strong>{stats.lateCount}</strong></span>
        <span>Alertes <strong>{stats.alertCount}</strong></span>
      </div>
    </section>
  );
}
