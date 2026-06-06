import { useEffect, useMemo, useState } from "react";
import type {
  AttendanceDraft,
  AttendancePlayer,
  AttendanceRecord,
  AttendanceSession,
  AttendanceTeam,
} from "../../types/attendance";
import { useAuth } from "../../features/auth/context/AuthContext";
import {
  canEditAttendance,
  canExportAttendance,
  canParentReferentConfirmLogistics,
  canValidateAttendance,
  canViewSensitiveAttendanceNotes,
} from "../../lib/attendance/attendancePermissions";
import {
  buildAttendanceAlerts,
  computePlayerAttendanceStats,
  computeSessionStats,
  computeTeamAttendanceStats,
} from "../../lib/attendance/attendanceStats";
import { computeAttendanceQualityScore } from "../../lib/attendance/attendanceScoring";
import { AttendanceSessionSelector } from "./AttendanceSessionSelector";
import { AttendanceCallSheet } from "./AttendanceCallSheet";
import { AttendanceStatsPanel } from "./AttendanceStatsPanel";
import { AttendanceAlertsPanel } from "./AttendanceAlertsPanel";
import { AttendanceExportPanel } from "./AttendanceExportPanel";
import { AttendanceHeader } from "./AttendanceHeader";
import { AttendanceQualityPanel } from "./AttendanceQualityPanel";
import { AttendanceTeamSummary } from "./AttendanceTeamSummary";
import { AttendancePlayerSummary } from "./AttendancePlayerSummary";
import { ParentReferentAttendanceView } from "./ParentReferentAttendanceView";
import "../../styles/attendance.css";

const teams: AttendanceTeam[] = [
  { id: "u13m1", name: "U13 Masculins 1", category: "U13" },
  { id: "u15f1", name: "U15 Féminines", category: "U15" },
  { id: "u18m", name: "U18 Masculins", category: "U18" },
];

const players: AttendancePlayer[] = [
  { id: "p1", firstName: "Noah", lastName: "Martin", category: "U13", teamId: "u13m1", teamName: "U13 Masculins 1" },
  { id: "p2", firstName: "Lina", lastName: "Bernard", category: "U13", teamId: "u13m1", teamName: "U13 Masculins 1" },
  { id: "p3", firstName: "Adam", lastName: "Morel", category: "U13", teamId: "u13m1", teamName: "U13 Masculins 1" },
  { id: "p4", firstName: "Sofia", lastName: "Petit", category: "U13", teamId: "u13m1", teamName: "U13 Masculins 1" },
  { id: "p5", firstName: "Ilyes", lastName: "Robert", category: "U13", teamId: "u13m1", teamName: "U13 Masculins 1" },
  { id: "p6", firstName: "Emma", lastName: "Durand", category: "U15", teamId: "u15f1", teamName: "U15 Féminines" },
  { id: "p7", firstName: "Maya", lastName: "Leroy", category: "U15", teamId: "u15f1", teamName: "U15 Féminines" },
  { id: "p8", firstName: "Nora", lastName: "Garcia", category: "U15", teamId: "u15f1", teamName: "U15 Féminines" },
  { id: "p9", firstName: "Ethan", lastName: "Simon", category: "U18", teamId: "u18m", teamName: "U18 Masculins" },
  { id: "p10", firstName: "Lucas", lastName: "Michel", category: "U18", teamId: "u18m", teamName: "U18 Masculins" },
];

function nowIso() {
  return new Date().toISOString();
}

function defaultSession(teamId = "u13m1", date = new Date().toISOString().slice(0, 10)): AttendanceSession {
  return {
    id: `session-${teamId}-${date}`,
    teamId,
    title: "Appel séance",
    date,
    startTime: "18:30",
    endTime: "20:00",
    location: "Gymnase BCVB",
    type: "entrainement",
    createdBy: "BCVB",
    coachId: "BCVB",
    locked: false,
    notes: "",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

function recordsForSession(session: AttendanceSession, teamPlayers: AttendancePlayer[], updatedBy: string): AttendanceRecord[] {
  return teamPlayers.map((player) => ({
    id: `${session.id}-${player.id}`,
    sessionId: session.id,
    teamId: session.teamId,
    playerId: player.id,
    status: "present",
    reason: "",
    delayMinutes: 0,
    arrivalDelayMinutes: 0,
    injuryNote: "",
    logisticNote: "",
    source: updatedBy === "parent_referent" ? "parent_referent" : updatedBy === "admin" ? "admin" : "coach",
    validatedByCoach: updatedBy !== "parent_referent",
    createdBy: updatedBy,
    updatedBy,
    createdAt: nowIso(),
    parentConfirmed: false,
    coachComment: "",
    updatedAt: nowIso(),
  }));
}

function draftKey(teamId: string, sessionDate: string) {
  return `bcvb.attendance.draft.${teamId}.${sessionDate}`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function AttendancePage() {
  const { profile } = useAuth();
  const role = profile?.role;
  const [session, setSession] = useState(() => defaultSession());
  const teamPlayers = useMemo(() => players.filter((player) => player.teamId === session.teamId), [session.teamId]);
  const [records, setRecords] = useState(() => recordsForSession(session, teamPlayers, role || "coach"));
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [storedDraft, setStoredDraft] = useState<AttendanceDraft | null>(null);
  const [logisticsNote, setLogisticsNote] = useState("");
  const canEdit = canEditAttendance(role, session.teamId);
  const canValidate = canValidateAttendance(role);
  const canExport = canExportAttendance(role);
  const canViewNotes = canViewSensitiveAttendanceNotes(role);
  const canConfirmLogistics = canParentReferentConfirmLogistics(role);
  const currentDraftKey = draftKey(session.teamId, session.date);

  const sessionStats = useMemo(() => computeSessionStats(records), [records]);
  const playerStats = useMemo(
    () => teamPlayers.map((player) => computePlayerAttendanceStats(records, [session], player.id)),
    [records, session, teamPlayers]
  );
  const promptPlayerStats = useMemo(
    () => teamPlayers.map((player) => computePlayerAttendanceStats(player.id, records, 1)),
    [records, teamPlayers]
  );
  const teamStats = useMemo(
    () => computeTeamAttendanceStats({
      teamId: session.teamId,
      records,
      playerCount: teamPlayers.length,
      totalSessions: 1,
      periodLabel: session.date,
    }),
    [records, session.date, session.teamId, teamPlayers.length]
  );
  const qualityScore = useMemo(
    () => computeAttendanceQualityScore([session], records, teamPlayers.length),
    [records, session, teamPlayers.length]
  );
  const alerts = useMemo(() => [
    ...buildAttendanceAlerts(sessionStats),
    ...playerStats.flatMap(buildAttendanceAlerts).filter((alert) => alert.level !== "info").slice(0, 5),
  ], [playerStats, sessionStats]);

  useEffect(() => {
    const availablePlayers = players.filter((player) => player.teamId === session.teamId);
    setRecords((current) => {
      const byPlayer = new Map(current.map((record) => [record.playerId, record]));
      return availablePlayers.map((player) => byPlayer.get(player.id) || recordsForSession(session, [player], role || "coach")[0]);
    });
  }, [role, session]);

  useEffect(() => {
    const stored = window.localStorage.getItem(currentDraftKey);
    setStoredDraft(stored ? JSON.parse(stored) as AttendanceDraft : null);
  }, [currentDraftKey]);

  function persistDraft(nextSession = session, nextRecords = records) {
    const draft: AttendanceDraft = {
      session: nextSession,
      records: nextRecords,
      updatedAt: nowIso(),
    };
    window.localStorage.setItem(draftKey(nextSession.teamId, nextSession.date), JSON.stringify(draft));
    setLastSavedAt(formatTime(draft.updatedAt));
  }

  useEffect(() => {
    if (storedDraft) return undefined;
    const interval = window.setInterval(() => persistDraft(), 3000);
    return () => window.clearInterval(interval);
  }, [currentDraftKey, records, session, storedDraft]);

  useEffect(() => {
    const onBeforeUnload = () => {
      if (!storedDraft) persistDraft();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [records, session, storedDraft]);

  function updateSession(nextSession: AttendanceSession) {
    const changedTeamOrDate = nextSession.teamId !== session.teamId || nextSession.date !== session.date;
    const finalSession = {
      ...nextSession,
      id: `session-${nextSession.teamId}-${nextSession.date}`,
    };
    setSession(finalSession);
    if (changedTeamOrDate) {
      const nextPlayers = players.filter((player) => player.teamId === finalSession.teamId);
      setRecords(recordsForSession(finalSession, nextPlayers, role || "coach"));
    }
  }

  function resumeDraft() {
    if (!storedDraft) return;
    setSession(storedDraft.session);
    setRecords(storedDraft.records);
    setLastSavedAt(formatTime(storedDraft.updatedAt));
    setStoredDraft(null);
  }

  function resetCall() {
    setRecords(recordsForSession(session, teamPlayers, role || "coach"));
  }

  function copyPreviousCall() {
    setRecords(records.map((record, index) => ({
      ...record,
      status: index % 6 === 0 ? "late" : index % 5 === 0 ? "absent_excused" : "present",
      reason: index % 5 === 0 ? "Copie séance précédente" : "",
      arrivalDelayMinutes: index % 6 === 0 ? 8 : 0,
      updatedAt: nowIso(),
    })));
  }

  function lockCall() {
    const validatedRecords = records.map((record) => ({
      ...record,
      validatedByCoach: true,
      updatedBy: role || "coach",
      updatedAt: nowIso(),
    }));
    const lockedSession = { ...session, locked: true, updatedAt: nowIso() };
    setRecords(validatedRecords);
    setSession(lockedSession);
    persistDraft(lockedSession, validatedRecords);
  }

  return (
    <main className="attendance-page">
      <AttendanceHeader stats={sessionStats} />

      {storedDraft && (
        <section className="attendance-card attendance-draft-banner">
          <div>
            <strong>Appel en cours détecté</strong>
            <p>Dernière sauvegarde : {formatTime(storedDraft.updatedAt)}.</p>
          </div>
          <button className="bcvb-button-primary" type="button" onClick={resumeDraft}>Reprendre l’appel en cours</button>
        </section>
      )}

      <section className="attendance-layout">
        <div className="attendance-main">
          <AttendanceSessionSelector session={session} teams={teams} disabled={session.locked || !canEdit} onChange={updateSession} />
          <AttendanceCallSheet
            players={teamPlayers}
            records={records}
            locked={session.locked}
            canEdit={canEdit}
            canViewNotes={canViewNotes}
            lastSavedAt={lastSavedAt}
            onRecordsChange={setRecords}
            onSave={() => persistDraft()}
            onReset={resetCall}
            onCopyPrevious={copyPreviousCall}
            onLock={canValidate ? lockCall : () => undefined}
          />
          <AttendanceTeamSummary stats={teamStats} />
          <ParentReferentAttendanceView
            session={session}
            players={teamPlayers}
            records={records}
            canSignal={canConfirmLogistics}
            logisticsNote={logisticsNote}
            onLogisticsNoteChange={setLogisticsNote}
            onRecordChange={setRecords}
          />
        </div>

        <aside className="attendance-sidebar">
          <AttendanceQualityPanel quality={qualityScore} stats={sessionStats} totalPlayers={teamPlayers.length} />
          <AttendanceStatsPanel stats={sessionStats} totalPlayers={teamPlayers.length} />
          <AttendancePlayerSummary players={teamPlayers} stats={promptPlayerStats} />
          <AttendanceAlertsPanel alerts={alerts} />
          <AttendanceExportPanel session={session} records={records} players={teamPlayers} playerStats={playerStats} canExport={canExport} />
        </aside>
      </section>
    </main>
  );
}

export default AttendancePage;
