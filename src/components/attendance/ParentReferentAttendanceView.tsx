import type { AttendancePlayer, AttendanceRecord, AttendanceSession } from "../../types/attendance";
import { ParentReferentAttendancePanel } from "./ParentReferentAttendancePanel";

export function ParentReferentAttendanceView({
  session,
  players,
  records,
  canSignal,
  logisticsNote,
  onLogisticsNoteChange,
  onRecordChange,
}: {
  session: AttendanceSession;
  players: AttendancePlayer[];
  records: AttendanceRecord[];
  canSignal: boolean;
  logisticsNote: string;
  onLogisticsNoteChange: (value: string) => void;
  onRecordChange: (records: AttendanceRecord[]) => void;
}) {
  return (
    <section className="parent-referent-attendance-view">
      <section className="attendance-card attendance-parent-scope">
        <div className="attendance-section-title">
          <span>Vue parent référent</span>
          <h2>{session.title}</h2>
        </div>
        <p>{session.date} · {session.startTime || "horaire à confirmer"} · {session.location || "lieu à confirmer"}</p>
        <p>Accès limité à la logistique et aux signalements utiles. Les évaluations techniques et notes coach restent masquées.</p>
      </section>
      <ParentReferentAttendancePanel
        players={players}
        records={records}
        canConfirm={canSignal}
        logisticsNote={logisticsNote}
        onLogisticsNoteChange={onLogisticsNoteChange}
        onRecordChange={onRecordChange}
      />
    </section>
  );
}
