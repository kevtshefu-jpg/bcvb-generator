import type { AttendanceStats } from "../../types/attendance";

export function AttendanceStatsPanel({ stats, totalPlayers }: { stats: AttendanceStats; totalPlayers: number }) {
  return (
    <aside className="attendance-card attendance-stats-panel">
      <div className="attendance-section-title">
        <span>Statistiques séance</span>
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
        <span>Total joueurs <strong>{totalPlayers}</strong></span>
        <span>Relevés <strong>{stats.recordedCount}</strong></span>
        <span>Non renseignés <strong>{stats.missingRecords}</strong></span>
        <span>Complétude <strong>{stats.completionRate}%</strong></span>
        <span>Présents <strong>{stats.presentCount}</strong></span>
        <span>Abs. excusées <strong>{stats.absentExcusedCount}</strong></span>
        <span>Abs. non excusées <strong>{stats.absentUnexcusedCount}</strong></span>
        <span>Retards <strong>{stats.lateCount}</strong></span>
        <span>Blessés <strong>{stats.injuredCount}</strong></span>
        <span>Ponctualité <strong>{stats.punctualityRate}%</strong></span>
        <span>Fiabilité <strong>{stats.reliabilityScore}%</strong></span>
      </div>
    </aside>
  );
}
