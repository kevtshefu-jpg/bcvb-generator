import type { AttendancePlayer, AttendanceRecord, AttendanceSession, AttendanceStats } from "../../types/attendance";
import { getAttendanceStatusLabel } from "./attendanceScoring";

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function playerName(players: AttendancePlayer[], playerId: string) {
  const player = players.find((item) => item.id === playerId);
  return player ? `${player.firstName} ${player.lastName}` : playerId;
}

function recordForPlayer(
  records: AttendanceRecord[],
  sessionId: string,
  playerId: string,
) {
  return records.find(
    (record) => record.sessionId === sessionId && record.playerId === playerId,
  );
}

function percentageOrUnrecorded(value: number, recordedCount: number) {
  return recordedCount > 0 ? `${value}%` : "Non renseigné";
}

export function exportAttendanceCsv(
  records: AttendanceRecord[],
  players: AttendancePlayer[],
  sessions: AttendanceSession[]
): string {
  return [
    ["date", "equipe", "seance", "joueur", "statut", "motif", "retard", "source", "validation_coach"].join(";"),
    ...sessions.flatMap((session) => players.map((player) => {
      const record = recordForPlayer(records, session.id, player.id);
      return [
        session.date,
        player.teamName || session.teamId,
        session.title,
        `${player.firstName} ${player.lastName}`,
        record ? getAttendanceStatusLabel(record.status) : "Non renseigné",
        record?.reason,
        record?.delayMinutes ?? record?.arrivalDelayMinutes,
        record?.source,
        record ? (record.validatedByCoach ? "oui" : "non") : "Non renseigné",
      ].map(csvCell).join(";");
    })),
  ].join("\n");
}

export function exportAttendanceSessionCsv(
  session: AttendanceSession,
  records: AttendanceRecord[],
  players: AttendancePlayer[]
): string {
  return [
    ["session", "date", "joueur", "statut", "motif", "retard_minutes", "parent_confirme", "commentaire"].join(";"),
    ...players.map((player) => {
      const record = recordForPlayer(records, session.id, player.id);
      return [
      session.title,
      session.date,
      `${player.firstName} ${player.lastName}`,
      record ? getAttendanceStatusLabel(record.status) : "Non renseigné",
      record?.reason,
      record?.delayMinutes ?? record?.arrivalDelayMinutes,
      record ? (record.parentConfirmed ? "oui" : "non") : "Non renseigné",
      record?.coachComment,
    ].map(csvCell).join(";");
    }),
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
      percentageOrUnrecorded(stat.attendanceRate, stat.recordedCount),
      percentageOrUnrecorded(stat.punctualityRate, stat.recordedCount),
      percentageOrUnrecorded(stat.reliabilityScore, stat.recordedCount),
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
    `Présents : ${present}/${records.length} relevés renseignés (${players.length} attendus)`,
    `Retards : ${late}`,
    `Absences non excusées : ${unexcused}`,
    "",
    "## Détail",
    ...players.map((player) => {
      const record = recordForPlayer(records, session.id, player.id);
      return record
        ? `- ${player.firstName} ${player.lastName} : ${getAttendanceStatusLabel(record.status)}${record.reason ? ` (${record.reason})` : ""}`
        : `- ${player.firstName} ${player.lastName} : Non renseigné`;
    }),
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
