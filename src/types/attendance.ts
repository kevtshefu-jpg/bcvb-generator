export type AttendanceStatus =
  | "present"
  | "absent_excused"
  | "absent_unexcused"
  | "late"
  | "injured"
  | "exempt"
  | "observation"
  | "exempted"
  | "club_selection"
  | "external_selection"
  | "other";

export type AttendanceSource =
  | "coach"
  | "admin"
  | "parent_referent"
  | "import"
  | "auto";

export type AttendanceSessionType =
  | "entrainement"
  | "match"
  | "stage"
  | "tournoi"
  | "reunion"
  | "autre"
  | "evenement_club";

export interface AttendanceSession {
  id: string;
  teamId: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  type: AttendanceSessionType;
  coachId?: string;
  createdBy: string;
  locked?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  teamId?: string;
  playerId: string;
  status: AttendanceStatus;
  reason?: string;
  delayMinutes?: number;
  injuryNote?: string;
  logisticNote?: string;
  source?: AttendanceSource;
  validatedByCoach?: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  arrivalDelayMinutes?: number;
  injuryDetails?: string;
  parentConfirmed?: boolean;
  coachComment?: string;
  updatedAt: string;
}

export interface AttendancePlayerView {
  playerId: string;
  firstName: string;
  lastName: string;
  category?: string;
  teamName?: string;
  status: AttendanceStatus;
  reason?: string;
  delayMinutes?: number;
  arrivalDelayMinutes?: number;
  injuryNote?: string;
  logisticNote?: string;
  attendanceRate?: number;
  alert?: string;
  warning?: string;
}

export interface AttendanceStats {
  playerId?: string;
  teamId?: string;
  periodLabel: string;
  totalSessions: number;
  presentCount: number;
  absentExcusedCount: number;
  absentUnexcusedCount: number;
  lateCount: number;
  injuredCount: number;
  attendanceRate: number;
  punctualityRate: number;
  reliabilityScore: number;
}

export interface AttendanceTeamStats {
  teamId: string;
  periodLabel: string;
  totalSessions: number;
  playerCount: number;
  presentCount: number;
  absentExcusedCount: number;
  absentUnexcusedCount: number;
  lateCount: number;
  injuredCount: number;
  attendanceRate: number;
  unexcusedAbsenceRate: number;
  alertCount: number;
}

export interface AttendancePlayerStats {
  playerId: string;
  totalSessions: number;
  presentCount: number;
  absentExcusedCount: number;
  absentUnexcusedCount: number;
  lateCount: number;
  injuredCount: number;
  attendanceRate: number;
  unexcusedAbsenceRate: number;
  reliabilityLabel: "excellent" | "bon" | "à surveiller" | "alerte";
}

export interface AttendanceQualityScore {
  score: number;
  label: "excellent" | "bon" | "à compléter" | "insuffisant";
  missingSessions: number;
  missingReasons: number;
  unvalidatedRecords: number;
  recommendedActions: string[];
}

export interface AttendanceAlert {
  id: string;
  level: "info" | "warning" | "critical";
  playerId?: string;
  teamId?: string;
  message: string;
  recommendedAction: string;
}

export type AttendanceTeam = {
  id: string;
  name: string;
  category: string;
};

export type AttendancePlayer = {
  id: string;
  firstName: string;
  lastName: string;
  category?: string;
  teamId: string;
  teamName?: string;
};

export type AttendanceDraft = {
  session: AttendanceSession;
  records: AttendanceRecord[];
  updatedAt: string;
};

export type AttendanceDashboardData = {
  globalAttendanceRate: number;
  teamsAttendanceRanking: Array<{ teamId: string; teamName: string; attendanceRate: number }>;
  criticalPlayers: AttendanceAlert[];
  missingCalls: AttendanceSession[];
  positiveRegularPlayers: AttendanceAlert[];
};
