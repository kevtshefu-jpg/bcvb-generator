import type {
  AttendanceAlert,
  AttendanceDashboardData,
  AttendancePlayer,
  AttendancePlayerStats,
  AttendanceRecord,
  AttendanceSession,
  AttendanceStats,
  AttendanceTeam,
  AttendanceTeamStats,
} from "../../types/attendance";
import { getAttendanceReliabilityWeight } from "./attendanceScoring";

function countsFor(records: AttendanceRecord[]) {
  const total = records.length;
  const presentCount = records.filter((record) => record.status === "present" || record.status === "club_selection").length;
  const absentExcusedCount = records.filter((record) => record.status === "absent_excused").length;
  const absentUnexcusedCount = records.filter((record) => record.status === "absent_unexcused").length;
  const lateCount = records.filter((record) => record.status === "late").length;
  const injuredCount = records.filter((record) => record.status === "injured").length;
  const onTimeCount = records.filter((record) => record.status !== "late").length;
  const reliabilityScore = total
    ? Math.round((records.reduce((sum, record) => sum + getAttendanceReliabilityWeight(record.status), 0) / total) * 100)
    : 0;

  return {
    total,
    presentCount,
    absentExcusedCount,
    absentUnexcusedCount,
    lateCount,
    injuredCount,
    attendanceRate: total ? Math.round((presentCount / total) * 100) : 0,
    punctualityRate: total ? Math.round((onTimeCount / total) * 100) : 0,
    reliabilityScore,
  };
}

export function computePlayerAttendanceStats(records: AttendanceRecord[], sessions: AttendanceSession[], playerId: string): AttendanceStats;
export function computePlayerAttendanceStats(playerId: string, records: AttendanceRecord[], totalSessions: number): AttendancePlayerStats;
export function computePlayerAttendanceStats(
  first: AttendanceRecord[] | string,
  second: AttendanceSession[] | AttendanceRecord[],
  third: string | number
): AttendanceStats | AttendancePlayerStats {
  if (typeof first === "string") {
    const playerId = first;
    const records = second as AttendanceRecord[];
    const totalSessions = third as number;
    const playerRecords = records.filter((record) => record.playerId === playerId);
    const presentCount = playerRecords.filter((record) => record.status === "present" || record.status === "club_selection").length;
    const absentExcusedCount = playerRecords.filter((record) => record.status === "absent_excused").length;
    const absentUnexcusedCount = playerRecords.filter((record) => record.status === "absent_unexcused").length;
    const lateCount = playerRecords.filter((record) => record.status === "late").length;
    const injuredCount = playerRecords.filter((record) => record.status === "injured").length;
    const expected = Math.max(1, totalSessions);
    const attendanceRate = Math.round((presentCount / expected) * 100);
    const unexcusedAbsenceRate = Math.round((absentUnexcusedCount / expected) * 100);

    return {
      playerId,
      totalSessions,
      presentCount,
      absentExcusedCount,
      absentUnexcusedCount,
      lateCount,
      injuredCount,
      attendanceRate,
      unexcusedAbsenceRate,
      reliabilityLabel: attendanceRate >= 90 && unexcusedAbsenceRate === 0
        ? "excellent"
        : attendanceRate >= 80
          ? "bon"
          : attendanceRate >= 65
            ? "à surveiller"
            : "alerte",
    };
  }

  const records = first;
  const sessions = second as AttendanceSession[];
  const playerId = third as string;
  const playerRecords = records.filter((record) => record.playerId === playerId);
  const sessionDates = sessions.map((session) => session.date).sort();
  const counts = countsFor(playerRecords);

  return {
    playerId,
    periodLabel: sessionDates.length ? `${sessionDates[0]} → ${sessionDates[sessionDates.length - 1]}` : "Période courante",
    totalSessions: counts.total,
    presentCount: counts.presentCount,
    absentExcusedCount: counts.absentExcusedCount,
    absentUnexcusedCount: counts.absentUnexcusedCount,
    lateCount: counts.lateCount,
    injuredCount: counts.injuredCount,
    attendanceRate: counts.attendanceRate,
    punctualityRate: counts.punctualityRate,
    reliabilityScore: counts.reliabilityScore,
  };
}

export function computeTeamAttendanceStats(records: AttendanceRecord[], sessions: AttendanceSession[], teamId: string): AttendanceStats;
export function computeTeamAttendanceStats(params: {
  teamId: string;
  records: AttendanceRecord[];
  playerCount: number;
  totalSessions: number;
  periodLabel: string;
}): AttendanceTeamStats;
export function computeTeamAttendanceStats(
  first: AttendanceRecord[] | {
    teamId: string;
    records: AttendanceRecord[];
    playerCount: number;
    totalSessions: number;
    periodLabel: string;
  },
  second?: AttendanceSession[],
  third?: string
): AttendanceStats | AttendanceTeamStats {
  if (!Array.isArray(first)) {
    const { teamId, records, playerCount, totalSessions, periodLabel } = first;
    const presentCount = records.filter((record) => record.status === "present" || record.status === "club_selection").length;
    const absentExcusedCount = records.filter((record) => record.status === "absent_excused").length;
    const absentUnexcusedCount = records.filter((record) => record.status === "absent_unexcused").length;
    const lateCount = records.filter((record) => record.status === "late").length;
    const injuredCount = records.filter((record) => record.status === "injured").length;
    const expected = Math.max(1, playerCount * totalSessions);

    return {
      teamId,
      periodLabel,
      totalSessions,
      playerCount,
      presentCount,
      absentExcusedCount,
      absentUnexcusedCount,
      lateCount,
      injuredCount,
      attendanceRate: Math.round((presentCount / expected) * 100),
      unexcusedAbsenceRate: Math.round((absentUnexcusedCount / expected) * 100),
      alertCount: absentUnexcusedCount,
    };
  }

  const records = first;
  const sessions = second || [];
  const teamId = third || "";
  const teamSessions = sessions.filter((session) => session.teamId === teamId);
  const sessionIds = new Set(teamSessions.map((session) => session.id));
  const teamRecords = records.filter((record) => sessionIds.has(record.sessionId));
  const counts = countsFor(teamRecords);

  return {
    teamId,
    periodLabel: teamSessions.length ? `${teamSessions[0].date} → ${teamSessions[teamSessions.length - 1].date}` : "Période courante",
    totalSessions: teamSessions.length,
    presentCount: counts.presentCount,
    absentExcusedCount: counts.absentExcusedCount,
    absentUnexcusedCount: counts.absentUnexcusedCount,
    lateCount: counts.lateCount,
    injuredCount: counts.injuredCount,
    attendanceRate: counts.attendanceRate,
    punctualityRate: counts.punctualityRate,
    reliabilityScore: counts.reliabilityScore,
  };
}

export function buildAttendanceAlerts(stats: AttendanceStats): AttendanceAlert[] {
  const alerts: AttendanceAlert[] = [];
  const scope = stats.playerId ? { playerId: stats.playerId } : { teamId: stats.teamId };

  if (stats.attendanceRate < 60) {
    alerts.push({
      id: `${stats.playerId || stats.teamId}-critical-rate`,
      level: "critical",
      ...scope,
      message: `Taux de présence critique : ${stats.attendanceRate} %.`,
      recommendedAction: "Contacter la famille ou faire un point individuel.",
    });
  } else if (stats.attendanceRate < 75) {
    alerts.push({
      id: `${stats.playerId || stats.teamId}-warning-rate`,
      level: "warning",
      ...scope,
      message: `Taux de présence à surveiller : ${stats.attendanceRate} %.`,
      recommendedAction: "Identifier les motifs récurrents et ajuster le suivi.",
    });
  }

  if (stats.absentUnexcusedCount >= 3) {
    alerts.push({
      id: `${stats.playerId || stats.teamId}-unexcused`,
      level: "critical",
      ...scope,
      message: `${stats.absentUnexcusedCount} absences non excusées.`,
      recommendedAction: "Demander une régularisation et clarifier les attendus.",
    });
  }

  if (stats.lateCount >= 3) {
    alerts.push({
      id: `${stats.playerId || stats.teamId}-late`,
      level: "warning",
      ...scope,
      message: `${stats.lateCount} retards sur la période.`,
      recommendedAction: "Rappeler les horaires et sécuriser l’organisation transport.",
    });
  }

  if (stats.injuredCount >= 2) {
    alerts.push({
      id: `${stats.playerId || stats.teamId}-injury`,
      level: "info",
      ...scope,
      message: "Blessure répétée ou reprise à suivre.",
      recommendedAction: "Adapter la charge et documenter le retour progressif.",
    });
  }

  if (stats.attendanceRate > 90 && stats.totalSessions >= 3) {
    alerts.push({
      id: `${stats.playerId || stats.teamId}-positive`,
      level: "info",
      ...scope,
      message: `Engagement très régulier : ${stats.attendanceRate} %.`,
      recommendedAction: "Valoriser l’assiduité et maintenir le suivi.",
    });
  }

  return alerts;
}

export function buildAttendanceDashboardData(
  records: AttendanceRecord[],
  sessions: AttendanceSession[],
  teams: AttendanceTeam[],
  players: AttendancePlayer[]
): AttendanceDashboardData {
  const globalStats = countsFor(records);
  const teamsAttendanceRanking = teams
    .map((team) => ({
      teamId: team.id,
      teamName: team.name,
      attendanceRate: computeTeamAttendanceStats(records, sessions, team.id).attendanceRate,
    }))
    .sort((a, b) => b.attendanceRate - a.attendanceRate);
  const playerAlerts = players.flatMap((player) =>
    buildAttendanceAlerts(computePlayerAttendanceStats(records, sessions, player.id))
      .filter((alert) => alert.level === "critical")
  );
  const positiveRegularPlayers = players.flatMap((player) =>
    buildAttendanceAlerts(computePlayerAttendanceStats(records, sessions, player.id))
      .filter((alert) => alert.message.includes("très régulier"))
  );
  const recordedSessionIds = new Set(records.map((record) => record.sessionId));
  const missingCalls = sessions.filter((session) => !recordedSessionIds.has(session.id));

  return {
    globalAttendanceRate: globalStats.attendanceRate,
    teamsAttendanceRanking,
    criticalPlayers: playerAlerts,
    missingCalls,
    positiveRegularPlayers,
  };
}

export function computeSessionStats(records: AttendanceRecord[]): AttendanceStats {
  const counts = countsFor(records);
  return {
    periodLabel: "Séance courante",
    totalSessions: 1,
    presentCount: counts.presentCount,
    absentExcusedCount: counts.absentExcusedCount,
    absentUnexcusedCount: counts.absentUnexcusedCount,
    lateCount: counts.lateCount,
    injuredCount: counts.injuredCount,
    attendanceRate: counts.attendanceRate,
    punctualityRate: counts.punctualityRate,
    reliabilityScore: counts.reliabilityScore,
  };
}
