import type { AttendanceStatus } from "../../types/attendance";
import { getAttendanceStatusLabel, getAttendanceStatusTone } from "../../lib/attendance/attendanceScoring";

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  return (
    <span className={`attendance-status-badge attendance-status-badge--${getAttendanceStatusTone(status)}`}>
      {getAttendanceStatusLabel(status)}
    </span>
  );
}

