import type { AttendancePlayer, AttendancePlayerStats } from "../../types/attendance";

export function AttendancePlayerSummary({
  players,
  stats,
}: {
  players: AttendancePlayer[];
  stats: AttendancePlayerStats[];
}) {
  const visibleStats = stats
    .slice()
    .sort((a, b) => {
      if (a.recordedCount === 0) return 1;
      if (b.recordedCount === 0) return -1;
      if (a.attendanceRate === null) return 1;
      if (b.attendanceRate === null) return -1;
      return a.attendanceRate - b.attendanceRate;
    })
    .slice(0, 5);

  return (
    <section className="attendance-card attendance-player-summary">
      <div className="attendance-section-title">
        <span>Joueurs à suivre</span>
        <h2>Assiduité individuelle</h2>
      </div>
      <div className="attendance-player-summary-list">
        {visibleStats.map((item) => {
          const player = players.find((candidate) => candidate.id === item.playerId);
          return (
            <article key={item.playerId}>
              <strong>{player ? `${player.firstName} ${player.lastName}` : item.playerId}</strong>
              <span>
                {item.recordedCount === 0 || item.attendanceRate === null
                  ? "Non renseigné"
                  : `${item.attendanceRate}% · ${item.reliabilityLabel}`}
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
