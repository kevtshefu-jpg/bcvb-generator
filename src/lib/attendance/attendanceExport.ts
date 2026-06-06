import type { AttendancePlayer, AttendanceRecord, AttendanceSession, AttendanceStats } from "../../types/attendance";
import { getAttendanceStatusLabel } from "./attendanceScoring";

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function playerName(players: AttendancePlayer[], playerId: string) {
  const player = players.find((item) => item.id === playerId);
  return player ? `${player.firstName} ${player.lastName}` : playerId;
}

function sessionForRecord(sessions: AttendanceSession[], record: AttendanceRecord) {
  return sessions.find((session) => session.id === record.sessionId);
}

function playerForRecord(players: AttendancePlayer[], record: AttendanceRecord) {
  return players.find((player) => player.id === record.playerId);
}

export function exportAttendanceCsv(
  records: AttendanceRecord[],
  players: AttendancePlayer[],
  sessions: AttendanceSession[]
): string {
  return [
    ["date", "equipe", "seance", "joueur", "statut", "motif", "retard", "source", "validation_coach"].join(";"),
    ...records.map((record) => {
      const session = sessionForRecord(sessions, record);
      const player = playerForRecord(players, record);
      return [
        session?.date,
        player?.teamName || record.teamId,
        session?.title || record.sessionId,
        playerName(players, record.playerId),
        getAttendanceStatusLabel(record.status),
        record.reason,
        record.delayMinutes ?? record.arrivalDelayMinutes,
        record.source || "coach",
        record.validatedByCoach ? "oui" : "non",
      ].map(csvCell).join(";");
    }),
  ].join("\n");
}

export function exportAttendanceSessionCsv(
  session: AttendanceSession,
  records: AttendanceRecord[],
  players: AttendancePlayer[]
): string {
  return [
    ["session", "date", "joueur", "statut", "motif", "retard_minutes", "parent_confirme", "commentaire"].join(";"),
    ...records.map((record) => [
      session.title,
      session.date,
      playerName(players, record.playerId),
      getAttendanceStatusLabel(record.status),
      record.reason,
      record.delayMinutes ?? record.arrivalDelayMinutes,
      record.parentConfirmed ? "oui" : "non",
      record.coachComment,
    ].map(csvCell).join(";")),
  ].join("\n");
}

export function exportAttendanceTeamCsv(stats: AttendanceStats[], players: AttendancePlayer[]): string {
  return [
    ["joueur", "periode", "seances", "presents", "abs_excusees", "abs_non_excusees", "retards", "blessures", "taux_presence", "ponctualite", "fiabilite"].join(";"),
    ...stats.map((stat) => [
      stat.playerId ? playerName(players, stat.playerId) : stat.teamId,
      stat.periodLabel,
      stat.totalSessions,
      stat.presentCount,
      stat.absentExcusedCount,
      stat.absentUnexcusedCount,
      stat.lateCount,
      stat.injuredCount,
      `${stat.attendanceRate}%`,
      `${stat.punctualityRate}%`,
      `${stat.reliabilityScore}%`,
    ].map(csvCell).join(";")),
  ].join("\n");
}

export function buildAttendanceSummaryMarkdown(
  session: AttendanceSession,
  records: AttendanceRecord[],
  players: AttendancePlayer[]
): string {
  const present = records.filter((record) => record.status === "present").length;
  const late = records.filter((record) => record.status === "late").length;
  const unexcused = records.filter((record) => record.status === "absent_unexcused").length;

  return [
    `# Synthèse présence - ${session.title}`,
    "",
    `Date : ${session.date}`,
    `Lieu : ${session.location || "Non renseigné"}`,
    `Présents : ${present}/${records.length}`,
    `Retards : ${late}`,
    `Absences non excusées : ${unexcused}`,
    "",
    "## Détail",
    ...records.map((record) => `- ${playerName(players, record.playerId)} : ${getAttendanceStatusLabel(record.status)}${record.reason ? ` (${record.reason})` : ""}`),
  ].join("\n");
}

export function downloadAttendanceFile(fileName: string, content: string, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function printAttendanceMarkdown(markdown: string) {
  const html = markdown
    .split("\n")
    .map((line) => {
      if (line.startsWith("# ")) return `<h1>${line.slice(2)}</h1>`;
      if (line.startsWith("## ")) return `<h2>${line.slice(3)}</h2>`;
      if (line.startsWith("- ")) return `<li>${line.slice(2)}</li>`;
      return `<p>${line || "&nbsp;"}</p>`;
    })
    .join("");
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return;
  win.document.write(`
    <html>
      <head>
        <title>Présences BCVB</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
          h1 { color: #c8102e; }
          li, p { line-height: 1.5; }
        </style>
      </head>
      <body>${html}</body>
    </html>
  `);
  win.document.close();
  win.print();
}
