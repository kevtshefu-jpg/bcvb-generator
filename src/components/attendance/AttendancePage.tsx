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
  listAttendanceTeams,
  loadAttendancePlayers,
  listAttendanceSessions,
  loadAttendanceRecords,
  createAttendanceSession,
  saveAttendanceRecord,
  validateAttendanceSession,
} from "../../features/attendance/attendanceService";
import { getPlanningLocalDay } from "../../features/operational-planning/planningLocalDate";
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

function nowIso() {
  return new Date().toISOString();
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
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [teams, setTeams] = useState<AttendanceTeam[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<AttendancePlayer[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draftDirty, setDraftDirty] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadTeams() {
      try {
        setLoading(true);
        setLoadError(null);

        const result = await listAttendanceTeams();

        if (cancelled) return;

        const mappedTeams: AttendanceTeam[] = result.map((team) => ({
          id: team.id,
          name: team.name,
          category: team.category,
        }));

        setTeams(mappedTeams);

        if (!mappedTeams.length) {
          setSession(null);
          setTeamPlayers([]);
          setSessions([]);
          setRecords([]);
          return;
        }

        const firstTeam = mappedTeams[0];
        setSelectedTeamId(firstTeam.id);

        const [playersResult, sessionsResult] = await Promise.all([
          loadAttendancePlayers(firstTeam.id),
          listAttendanceSessions(firstTeam.id),
        ]);

        if (cancelled) return;

        setTeamPlayers(
          playersResult.map((player) => ({
            ...player,
            teamName: firstTeam.name,
          })),
        );

        setSessions(sessionsResult);

        const firstSession = sessionsResult[0] || null;
        setSession(firstSession);

        if (firstSession) {
          const attendanceRecords = await loadAttendanceRecords(firstSession.id);

          if (!cancelled) {
            setRecords(attendanceRecords);
            setDraftDirty(false);
          }
        } else {
          setRecords([]);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Chargement des présences impossible.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTeams();

    return () => {
      cancelled = true;
    };
  }, []);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [storedDraft, setStoredDraft] = useState<AttendanceDraft | null>(null);
  const [logisticsNote, setLogisticsNote] = useState("");
  const canEdit = canEditAttendance(role, selectedTeamId);
  const canValidate = canValidateAttendance(role);
  const canExport = canExportAttendance(role);
  const canViewNotes = canViewSensitiveAttendanceNotes(role);
  const canConfirmLogistics = canParentReferentConfirmLogistics(role);
  const currentDraftKey = session
    ? draftKey(session.teamId, session.date)
    : null;

  const sessionStats = useMemo(() => computeSessionStats(records), [records]);
  const playerStats = useMemo(
    () => session
      ? teamPlayers.map((player) =>
          computePlayerAttendanceStats(records, [session], player.id)
        )
      : [],
    [records, session, teamPlayers],
  );
  const promptPlayerStats = useMemo(
    () => teamPlayers.map((player) => computePlayerAttendanceStats(player.id, records, 1)),
    [records, teamPlayers]
  );
  const teamStats = useMemo(
    () => {
      if (!session) {
        return {
          teamId: selectedTeamId,
          periodLabel: "Aucune séance sélectionnée",
          totalSessions: 0,
          playerCount: teamPlayers.length,
          presentCount: 0,
          absentExcusedCount: 0,
          absentUnexcusedCount: 0,
          lateCount: 0,
          injuredCount: 0,
          attendanceRate: 0,
          unexcusedAbsenceRate: 0,
          alertCount: 0,
        };
      }

      return computeTeamAttendanceStats({
        teamId: session.teamId,
        records,
        playerCount: teamPlayers.length,
        totalSessions: 1,
        periodLabel: session.date,
      });
    },
    [records, selectedTeamId, session, teamPlayers.length],
  );
  const qualityScore = useMemo(
    () =>
      session
        ? computeAttendanceQualityScore(
            [session],
            records,
            teamPlayers.length,
          )
        : {
            score: 0,
            label: "à compléter" as const,
            missingSessions: 0,
            missingReasons: 0,
            unvalidatedRecords: 0,
            recommendedActions: [
              "Sélectionner ou créer une séance d’appel.",
            ],
          },
    [records, session, teamPlayers.length],
  );
  const alerts = useMemo(() => [
    ...buildAttendanceAlerts(sessionStats),
    ...playerStats.flatMap(buildAttendanceAlerts).filter((alert) => alert.level !== "info").slice(0, 5),
  ], [playerStats, sessionStats]);

  useEffect(() => {
    if (!currentDraftKey) {
      setStoredDraft(null);
      return;
    }

    try {
      const stored = window.localStorage.getItem(currentDraftKey);
      setStoredDraft(
        stored ? JSON.parse(stored) as AttendanceDraft : null,
      );
    } catch {
      setStoredDraft(null);
    }
  }, [currentDraftKey]);

  function persistDraft(
    nextSession: AttendanceSession | null = session,
    nextRecords = records,
  ) {
    if (!nextSession) return;

    const draft: AttendanceDraft = {
      session: nextSession,
      records: nextRecords,
      updatedAt: nowIso(),
    };

    window.localStorage.setItem(
      draftKey(nextSession.teamId, nextSession.date),
      JSON.stringify(draft),
    );

  }

  useEffect(() => {
    if (!session || storedDraft || !draftDirty) return undefined;

    const interval = window.setInterval(() => {
      persistDraft();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [draftDirty, records, session, storedDraft]);

  useEffect(() => {
    const onBeforeUnload = () => {
      if (!storedDraft && draftDirty) persistDraft();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [draftDirty, records, session, storedDraft]);

  function updateDraftRecords(nextRecords: AttendanceRecord[]) {
    setRecords(nextRecords);
    setDraftDirty(true);
    setLastSavedAt("");
  }

  async function changeTeam(teamId: string) {
    if (draftDirty) persistDraft();
    setSelectedTeamId(teamId);

    try {
      setLoading(true);
      setLoadError(null);
      setRecords([]);
      setDraftDirty(false);

      const selectedTeam = teams.find((team) => team.id === teamId);
      const [playersResult, sessionsResult] = await Promise.all([
        loadAttendancePlayers(teamId),
        listAttendanceSessions(teamId),
      ]);

      setTeamPlayers(
        playersResult.map((player) => ({
          ...player,
          teamName: selectedTeam?.name,
        })),
      );
      setSessions(sessionsResult);

      const selectedSession = sessionsResult[0] || null;
      setSession(selectedSession);

      if (!selectedSession) return;

      const attendanceRecords = await loadAttendanceRecords(selectedSession.id);
      setRecords(attendanceRecords);
      setDraftDirty(false);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Chargement des présences impossible.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function changeAttendanceSession(sessionId: string) {
    const selectedSession = sessions.find((item) => item.id === sessionId);
    if (!selectedSession) return;

    try {
      setLoading(true);
      setLoadError(null);
      setSession(selectedSession);
      setRecords([]);
      setRecords(await loadAttendanceRecords(selectedSession.id));
      setDraftDirty(false);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Chargement des présences impossible.",
      );
    } finally {
      setLoading(false);
    }
  }

  function resumeDraft() {
    if (!storedDraft) return;
    setSession(storedDraft.session);
    setRecords(storedDraft.records);
    setLastSavedAt("");
    setDraftDirty(true);
    setStoredDraft(null);
  }

  async function resetCall() {
    if (!session) return;

    try {
      setLoading(true);
      setLoadError(null);
      setRecords(await loadAttendanceRecords(session.id));
      setDraftDirty(false);
      window.localStorage.removeItem(draftKey(session.teamId, session.date));
      setStoredDraft(null);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Chargement des présences impossible.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveCall(
    clearDraftAfterSuccess = true,
  ): Promise<AttendanceRecord[] | null> {
    if (!session) return null;
    if (session.locked) {
      setLoadError("Un appel validé ne peut plus être modifié.");
      return null;
    }

    try {
      setMutationLoading(true);
      setLoadError(null);

      const savedRecords = await Promise.all(
        records.map((record) => saveAttendanceRecord({
          sessionId: session.id,
          playerId: record.playerId,
          status: record.status,
          reason: record.reason,
          delayMinutes: record.delayMinutes ?? record.arrivalDelayMinutes,
          injuryNote: record.injuryNote ?? record.injuryDetails,
          logisticNote: record.logisticNote,
          coachComment: record.coachComment,
          source: record.source,
        })),
      );

      setRecords(savedRecords);
      setLastSavedAt(formatTime(nowIso()));
      setDraftDirty(false);
      if (clearDraftAfterSuccess) {
        window.localStorage.removeItem(draftKey(session.teamId, session.date));
        setStoredDraft(null);
      }
      return savedRecords;
    } catch (error) {
      persistDraft(session, records);
      setLoadError(
        error instanceof Error
          ? error.message
          : "Enregistrement des présences impossible.",
      );
      return null;
    } finally {
      setMutationLoading(false);
    }
  }

  async function lockCall() {
    if (!session) return;
    if (!canValidate) {
      setLoadError("Validation de l’appel interdite.");
      return;
    }

    const sessionToValidate = session;
    persistDraft(sessionToValidate, records);
    const savedRecords = await saveCall(false);
    if (!savedRecords) return;

    try {
      setMutationLoading(true);
      setLoadError(null);
      await validateAttendanceSession(sessionToValidate.id);

      const [serverSessions, serverRecords] = await Promise.all([
        listAttendanceSessions(selectedTeamId),
        loadAttendanceRecords(sessionToValidate.id),
      ]);
      const validatedSession = serverSessions.find(
        (item) => item.id === sessionToValidate.id,
      );

      if (!validatedSession) {
        throw new Error("La séance validée n’a pas été retrouvée côté serveur.");
      }

      setSessions(serverSessions);
      setSession(validatedSession);
      setRecords(serverRecords);
      setDraftDirty(false);
      window.localStorage.removeItem(
        draftKey(sessionToValidate.teamId, sessionToValidate.date),
      );
      setStoredDraft(null);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Validation de l’appel impossible.",
      );
    } finally {
      setMutationLoading(false);
    }
  }

  async function copyPreviousCall() {
    if (!session) return;

    const currentOrder = `${session.date}T${session.startTime || "00:00"}`;
    const previousSession = sessions
      .filter((item) =>
        item.id !== session.id
        && item.teamId === session.teamId
        && `${item.date}T${item.startTime || "00:00"}` < currentOrder
      )
      .sort((a, b) =>
        `${b.date}T${b.startTime || "00:00"}`.localeCompare(
          `${a.date}T${a.startTime || "00:00"}`,
        )
      )[0];

    if (!previousSession) {
      setLoadError("Aucune séance précédente n’est disponible pour cette équipe.");
      return;
    }

    try {
      setMutationLoading(true);
      setLoadError(null);
      const previousRecords = await loadAttendanceRecords(previousSession.id);
      const previousByPlayer = new Map(
        previousRecords.map((record) => [record.playerId, record]),
      );
      const currentPlayerIds = new Set(teamPlayers.map((player) => player.id));

      setRecords((currentRecords) => currentRecords.map((record) => {
        if (!currentPlayerIds.has(record.playerId)) return record;
        const previous = previousByPlayer.get(record.playerId);
        if (!previous) return record;

        return {
          ...record,
          status: previous.status,
          reason: previous.reason,
          delayMinutes: previous.delayMinutes ?? previous.arrivalDelayMinutes,
          arrivalDelayMinutes: previous.delayMinutes ?? previous.arrivalDelayMinutes,
          injuryNote: previous.injuryNote ?? previous.injuryDetails,
          injuryDetails: previous.injuryNote ?? previous.injuryDetails,
          logisticNote: previous.logisticNote,
          coachComment: previous.coachComment,
          updatedAt: nowIso(),
        };
      }));
      setDraftDirty(true);
      setLastSavedAt("");
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Copie de la séance précédente impossible.",
      );
    } finally {
      setMutationLoading(false);
    }
  }

  async function createCall() {
    if (!selectedTeamId || !canEdit) return;

    try {
      setMutationLoading(true);
      setLoadError(null);
      const created = await createAttendanceSession({
        teamId: selectedTeamId,
        date: getPlanningLocalDay().date,
        title: "Appel séance",
        type: "entrainement",
      });
      const serverSessions = await listAttendanceSessions(selectedTeamId);
      const serverSession = serverSessions.find((item) => item.id === created.id);

      if (!serverSession) {
        throw new Error("La séance créée n’a pas été retrouvée côté serveur.");
      }

      const serverRecords = await loadAttendanceRecords(created.id);
      setSessions(serverSessions);
      setSession(serverSession);
      setRecords(serverRecords);
      setDraftDirty(false);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Création de l’appel impossible.",
      );
    } finally {
      setMutationLoading(false);
    }
  }

  return (
    <main className="attendance-page">
      <AttendanceHeader stats={sessionStats} />

      {loadError && (
        <section className="attendance-card" role="alert">
          <strong>Opération impossible</strong>
          <p>{loadError}</p>
        </section>
      )}

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
          <AttendanceSessionSelector
            session={session}
            sessions={sessions}
            teams={teams}
            selectedTeamId={selectedTeamId}
            disabled={!canEdit || loading || mutationLoading}
            onTeamChange={(teamId) => void changeTeam(teamId)}
            onSessionChange={(sessionId) =>
              void changeAttendanceSession(sessionId)
            }
            onCreateSession={() => void createCall()}
          />
          {session ? (
            <>
              <AttendanceCallSheet
                players={teamPlayers}
                records={records}
                locked={session.locked}
                canEdit={canEdit}
                canViewNotes={canViewNotes}
                lastSavedAt={lastSavedAt}
                mutationLoading={mutationLoading}
                onRecordsChange={updateDraftRecords}
                onSave={() => void saveCall()}
                onReset={() => void resetCall()}
                onCopyPrevious={() => void copyPreviousCall()}
                onLock={() => void lockCall()}
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
            </>
          ) : (
            <section className="attendance-card">
              <div className="attendance-section-title">
                <span>Appel</span>
                <h2>Aucune séance disponible</h2>
              </div>

              <p>
                Cette équipe ne possède encore aucune séance d’appel.
              </p>
            </section>
          )}
        </div>

        <aside className="attendance-sidebar">
          <AttendanceQualityPanel quality={qualityScore} stats={sessionStats} totalPlayers={teamPlayers.length} />
          <AttendanceStatsPanel stats={sessionStats} totalPlayers={teamPlayers.length} />
          <AttendancePlayerSummary players={teamPlayers} stats={promptPlayerStats} />
          <AttendanceAlertsPanel alerts={alerts} />
          {session && (
            <AttendanceExportPanel
              session={session}
              records={records}
              players={teamPlayers}
              playerStats={playerStats}
              canExport={canExport}
            />
          )}
        </aside>
      </section>
    </main>
  );
}

export default AttendancePage;
