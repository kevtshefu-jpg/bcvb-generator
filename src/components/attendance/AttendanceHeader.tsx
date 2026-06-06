import type { AttendanceStats } from "../../types/attendance";

export function AttendanceHeader({ stats }: { stats: AttendanceStats }) {
  return (
    <section className="bcvb-dashboard-hero attendance-hero">
      <div>
        <p className="bcvb-eyebrow">Présences & absences</p>
        <h1 className="bcvb-title-xl">Appel rapide BCVB</h1>
        <p className="bcvb-subtitle">Suivre l’assiduité réelle des joueurs et sécuriser la logistique d’équipe.</p>
      </div>
      <div className="attendance-hero-meter">
        <strong>{stats.attendanceRate}%</strong>
        <span>séance</span>
      </div>
    </section>
  );
}

