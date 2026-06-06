import type { AttendanceQualityScore, AttendanceRecord, AttendanceSession, AttendanceStatus } from "../../types/attendance";
import {
  getAttendanceStatusLabel as getStatusLabel,
  getAttendanceStatusTone as getStatusTone,
  statusRequiresReason,
} from "./attendanceUtils";

export const attendanceStatuses: AttendanceStatus[] = [
  "present",
  "absent_excused",
  "absent_unexcused",
  "late",
  "injured",
  "exempt",
  "observation",
];

export function requiresAttendanceReason(status: AttendanceStatus): boolean {
  return statusRequiresReason(status);
}

export function getAttendanceStatusLabel(status: AttendanceStatus): string {
  return getStatusLabel(status);
}

export function getAttendanceStatusTone(status: AttendanceStatus) {
  return getStatusTone(status);
}

export function getAttendanceReliabilityWeight(status: AttendanceStatus) {
  const weights: Record<AttendanceStatus, number> = {
    present: 1,
    absent_excused: 0.72,
    absent_unexcused: 0,
    late: 0.82,
    injured: 0.68,
    exempt: 0.75,
    observation: 0.5,
    exempted: 0.75,
    club_selection: 1,
    external_selection: 0.86,
    other: 0.5,
  };

  return weights[status];
}

export function validateAttendanceRecord(status: AttendanceStatus, reason?: string, delay?: number) {
  const warnings: string[] = [];

  if (requiresAttendanceReason(status) && !reason?.trim()) {
    warnings.push("Motif obligatoire.");
  }

  if (status === "late" && (!delay || delay < 1)) {
    warnings.push("Indique le retard en minutes.");
  }

  return warnings;
}

export function computeAttendanceQualityScore(
  sessions: AttendanceSession[],
  records: AttendanceRecord[],
  expectedPlayerCount: number
): AttendanceQualityScore {
  const expectedRecords = sessions.length * expectedPlayerCount;
  const currentRecords = records.length;
  const missingSessions = Math.max(0, expectedRecords - currentRecords);
  const missingReasons = records.filter(
    (record) => statusRequiresReason(record.status) && !record.reason?.trim()
  ).length;
  const unvalidatedRecords = records.filter(
    (record) => record.source === "parent_referent" && !record.validatedByCoach
  ).length;

  let score = 100;
  score -= Math.min(35, missingSessions * 2);
  score -= Math.min(25, missingReasons * 3);
  score -= Math.min(20, unvalidatedRecords * 2);

  const recommendedActions: string[] = [];
  if (missingSessions > 0) recommendedActions.push("Compléter les appels manquants.");
  if (missingReasons > 0) recommendedActions.push("Ajouter les motifs obligatoires pour les absences, retards ou blessures.");
  if (unvalidatedRecords > 0) recommendedActions.push("Valider les présences signalées par les parents référents.");
  if (recommendedActions.length === 0) recommendedActions.push("Suivi des présences exploitable.");

  const finalScore = Math.max(0, Math.min(100, score));

  return {
    score: finalScore,
    label: finalScore >= 90 ? "excellent" : finalScore >= 75 ? "bon" : finalScore >= 60 ? "à compléter" : "insuffisant",
    missingSessions,
    missingReasons,
    unvalidatedRecords,
    recommendedActions,
  };
}
