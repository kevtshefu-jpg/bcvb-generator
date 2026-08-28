import type { AttendancePlayer, AttendanceRecord } from "../../types/attendance";
import { getAttendanceStatusLabel } from "../../lib/attendance/attendanceScoring";

export function ParentReferentAttendancePanel({
  players,
  records,
}: {
  players: AttendancePlayer[];
  records: AttendanceRecord[];
}) {
  return (
    <section className="attendance-card parent-attendance-panel">
      <div className="attendance-section-title">
        <span>Parents référents</span>
        <h2>Consultation de l’appel</h2>
      </div>
      <p className="attendance-muted">Les signalements et confirmations ne sont pas disponibles tant qu’ils ne peuvent pas être enregistrés officiellement.</p>
      <div className="attendance-parent-list">
        {players.map((player) => {
          const record = records.find((item) => item.playerId === player.id);
          return (
            <article key={player.id}>
              <div>
                <strong>{player.firstName} {player.lastName}</strong>
                <span>{record ? getAttendanceStatusLabel(record.status) : "Non renseigné"}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
