import type { AttendanceQualityScore, AttendanceStats } from "../../types/attendance";

export function AttendanceQualityPanel({
  quality,
  stats,
  totalPlayers,
}: {
  quality: AttendanceQualityScore | null;
  stats: AttendanceStats;
  totalPlayers: number;
}) {
  if (!quality) {
    return (
      <aside className="attendance-card attendance-quality-panel attendance-neutral-panel">
        <div className="attendance-section-title">
          <span>Qualité appel</span>
          <h2 aria-label="Qualité de l’appel non calculable : aucune séance sélectionnée">—</h2>
        </div>
        <p>Aucune séance sélectionnée</p>
      </aside>
    );
  }

  return (
    <aside className="attendance-card attendance-quality-panel">
      <div className="attendance-section-title">
        <span>Qualité appel</span>
        <h2>{quality.score}/100</h2>
      </div>
      <strong className={`attendance-quality-label attendance-quality-label--${quality.label.replace(/\s+/g, "-")}`}>{quality.label}</strong>
      <div className="attendance-stat-grid">
        <span>Joueurs <strong>{totalPlayers}</strong></span>
        <span>Relevés manquants <strong>{quality.missingRecords}</strong></span>
        <span>Complétude <strong>{quality.completionRate}%</strong></span>
        <span>Présents <strong>{stats.presentCount}</strong></span>
        <span>Abs. excusés <strong>{stats.absentExcusedCount}</strong></span>
        <span>Abs. non excusés <strong>{stats.absentUnexcusedCount}</strong></span>
        <span>Retards <strong>{stats.lateCount}</strong></span>
        <span>Blessés <strong>{stats.injuredCount}</strong></span>
        <span>Motifs manquants <strong>{quality.missingReasons}</strong></span>
        <span>À valider <strong>{quality.unvalidatedRecords}</strong></span>
      </div>
      <ul className="attendance-quality-actions">
        {quality.recommendedActions.map((action) => <li key={action}>{action}</li>)}
      </ul>
    </aside>
  );
}
