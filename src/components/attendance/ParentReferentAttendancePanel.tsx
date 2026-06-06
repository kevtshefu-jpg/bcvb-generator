import type { AttendancePlayer, AttendanceRecord } from "../../types/attendance";
import type { AttendanceStatus } from "../../types/attendance";
import { getAttendanceStatusLabel } from "../../lib/attendance/attendanceScoring";

export function ParentReferentAttendancePanel({
  players,
  records,
  canConfirm,
  logisticsNote,
  onLogisticsNoteChange,
  onRecordChange,
}: {
  players: AttendancePlayer[];
  records: AttendanceRecord[];
  canConfirm: boolean;
  logisticsNote: string;
  onLogisticsNoteChange: (value: string) => void;
  onRecordChange: (records: AttendanceRecord[]) => void;
}) {
  function toggleConfirmation(playerId: string) {
    if (!canConfirm) return;
    onRecordChange(records.map((record) => record.playerId === playerId ? {
      ...record,
      parentConfirmed: !record.parentConfirmed,
      source: "parent_referent",
      validatedByCoach: false,
      updatedAt: new Date().toISOString(),
    } : record));
  }

  function signalStatus(playerId: string, status: AttendanceStatus) {
    if (!canConfirm) return;
    onRecordChange(records.map((record) => record.playerId === playerId ? {
      ...record,
      status,
      source: "parent_referent",
      validatedByCoach: false,
      updatedBy: "parent_referent",
      reason: status === "present" ? record.reason || "Signalé parent référent" : record.reason || "Signalement parent référent",
      updatedAt: new Date().toISOString(),
    } : record));
  }

  return (
    <section className="attendance-card parent-attendance-panel">
      <div className="attendance-section-title">
        <span>Parents référents</span>
        <h2>Logistique et confirmations</h2>
      </div>
      <textarea
        value={logisticsNote}
        disabled={!canConfirm}
        onChange={(event) => onLogisticsNoteChange(event.target.value)}
        placeholder="Information déplacement, transport, goûter, maillots..."
      />
      <div className="attendance-parent-list">
        {players.map((player) => {
          const record = records.find((item) => item.playerId === player.id);
          return (
            <article key={player.id}>
              <div>
                <strong>{player.firstName} {player.lastName}</strong>
                <span>{record ? getAttendanceStatusLabel(record.status) : "Non renseigné"}</span>
              </div>
              <button type="button" disabled={!canConfirm} onClick={() => toggleConfirmation(player.id)}>
                {record?.parentConfirmed ? "Confirmé" : "À confirmer"}
              </button>
              <button type="button" disabled={!canConfirm} onClick={() => signalStatus(player.id, "present")}>Présence</button>
              <button type="button" disabled={!canConfirm} onClick={() => signalStatus(player.id, "absent_excused")}>Absence utile</button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
