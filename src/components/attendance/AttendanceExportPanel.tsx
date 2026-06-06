import type { AttendancePlayer, AttendanceRecord, AttendanceSession, AttendanceStats } from "../../types/attendance";
import {
  buildAttendanceSummaryMarkdown,
  downloadAttendanceFile,
  exportAttendanceCsv,
  exportAttendanceSessionCsv,
  exportAttendanceTeamCsv,
  printAttendanceMarkdown,
} from "../../lib/attendance/attendanceExport";

export function AttendanceExportPanel({
  session,
  records,
  players,
  playerStats,
  canExport,
}: {
  session: AttendanceSession;
  records: AttendanceRecord[];
  players: AttendancePlayer[];
  playerStats: AttendanceStats[];
  canExport: boolean;
}) {
  const summary = buildAttendanceSummaryMarkdown(session, records, players);
  const cleanTeamName = session.teamId.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const cleanPeriod = session.date.replace(/[^0-9-]+/g, "");

  return (
    <aside className="attendance-card attendance-export-panel">
      <div className="attendance-section-title">
        <span>Exports</span>
        <h2>CSV / PDF</h2>
      </div>
      <button type="button" disabled={!canExport} onClick={() => downloadAttendanceFile(`presences-bcvb-${cleanTeamName}-${cleanPeriod}.csv`, exportAttendanceCsv(records, players, [session]), "text/csv;charset=utf-8")}>CSV équipe complet</button>
      <button type="button" disabled={!canExport} onClick={() => downloadAttendanceFile(`appel-${session.teamId}-${session.date}.csv`, exportAttendanceSessionCsv(session, records, players), "text/csv;charset=utf-8")}>CSV appel séance</button>
      <button type="button" disabled={!canExport} onClick={() => downloadAttendanceFile(`periode-${session.teamId}.csv`, exportAttendanceTeamCsv(playerStats, players), "text/csv;charset=utf-8")}>CSV période équipe</button>
      <button type="button" disabled={!canExport} onClick={() => printAttendanceMarkdown(summary)}>PDF / impression séance</button>
      <button type="button" disabled={!canExport} onClick={() => downloadAttendanceFile(`presence-source-${session.id}.json`, JSON.stringify({ session, records }, null, 2), "application/json;charset=utf-8")}>JSON source</button>
      {!canExport && <p>Exports réservés aux coachs, responsables techniques et admins.</p>}
    </aside>
  );
}
