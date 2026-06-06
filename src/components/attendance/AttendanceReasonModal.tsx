import type { AttendanceRecord } from "../../types/attendance";
import { getAttendanceStatusLabel } from "../../lib/attendance/attendanceUtils";

export function AttendanceReasonModal({
  record,
  onChange,
  onClose,
}: {
  record: AttendanceRecord | null;
  onChange: (record: AttendanceRecord) => void;
  onClose: () => void;
}) {
  if (!record) return null;

  function patch(patchRecord: Partial<AttendanceRecord>) {
    onChange({ ...record!, ...patchRecord, updatedAt: new Date().toISOString() });
  }

  return (
    <div className="attendance-modal-backdrop" role="presentation">
      <section className="attendance-card attendance-reason-modal" role="dialog" aria-modal="true" aria-label="Motif présence">
        <div className="attendance-section-title">
          <span>Motif requis</span>
          <h2>{getAttendanceStatusLabel(record.status)}</h2>
        </div>
        <label>
          Motif
          <textarea value={record.reason || ""} onChange={(event) => patch({ reason: event.target.value })} />
        </label>
        {record.status === "late" && (
          <label>
            Retard en minutes
            <input type="number" min="0" value={record.delayMinutes ?? record.arrivalDelayMinutes ?? ""} onChange={(event) => patch({ delayMinutes: Number(event.target.value) || 0, arrivalDelayMinutes: Number(event.target.value) || 0 })} />
          </label>
        )}
        {record.status === "injured" && (
          <label>
            Note blessure
            <textarea value={record.injuryNote || record.injuryDetails || ""} onChange={(event) => patch({ injuryNote: event.target.value, injuryDetails: event.target.value })} />
          </label>
        )}
        <div className="attendance-modal-actions">
          <button type="button" onClick={onClose}>Fermer</button>
          <button type="button" onClick={onClose}>Valider motif</button>
        </div>
      </section>
    </div>
  );
}

