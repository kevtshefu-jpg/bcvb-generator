import type { AttendanceStatus } from "../../types/attendance";

export function getAttendanceStatusLabel(status: AttendanceStatus): string {
  const labels: Record<AttendanceStatus, string> = {
    present: "Présent",
    absent_excused: "Absent excusé",
    absent_unexcused: "Absent non excusé",
    late: "Retard",
    injured: "Blessé",
    exempt: "Dispensé",
    observation: "Observation",
    exempted: "Dispensé",
    club_selection: "Sélection club",
    external_selection: "Sélection extérieure",
    other: "Observation",
  };

  return labels[status];
}

export function getAttendanceStatusTone(status: AttendanceStatus) {
  const tones: Record<AttendanceStatus, "success" | "warning" | "danger" | "injury" | "medical" | "neutral" | "info"> = {
    present: "success",
    absent_excused: "warning",
    absent_unexcused: "danger",
    late: "info",
    injured: "injury",
    exempt: "neutral",
    observation: "neutral",
    exempted: "neutral",
    club_selection: "success",
    external_selection: "info",
    other: "neutral",
  };

  return tones[status];
}

export function statusRequiresReason(status: AttendanceStatus): boolean {
  return [
    "absent_excused",
    "absent_unexcused",
    "late",
    "injured",
    "exempt",
    "exempted",
    "observation",
    "other",
  ].includes(status);
}

export function normalizeAttendanceStatus(value: string): AttendanceStatus {
  const v = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

  if (v.includes("present")) return "present";
  if (v.includes("non excuse")) return "absent_unexcused";
  if (v.includes("excuse")) return "absent_excused";
  if (v.includes("retard")) return "late";
  if (v.includes("blesse")) return "injured";
  if (v.includes("dispense") || v.includes("exempt")) return "exempt";

  return "observation";
}
