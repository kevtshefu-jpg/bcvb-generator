import { useMemo, useState } from "react";
import type { AttendancePlayer, AttendanceRecord, AttendanceStatus } from "../../types/attendance";
import { attendanceStatuses, getAttendanceStatusLabel } from "../../lib/attendance/attendanceScoring";
import { AttendancePlayerRow } from "./AttendancePlayerRow";

export function AttendanceCallSheet({
  players,
  records,
  locked,
  canEdit,
  canViewNotes,
  lastSavedAt,
  onRecordsChange,
  onSave,
  onReset,
  onCopyPrevious,
  onLock,
}: {
  players: AttendancePlayer[];
  records: AttendanceRecord[];
  locked?: boolean;
  canEdit: boolean;
  canViewNotes: boolean;
  lastSavedAt?: string;
  onRecordsChange: (records: AttendanceRecord[]) => void;
  onSave: () => void;
  onReset: () => void;
  onCopyPrevious: () => void;
  onLock: () => void;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | "all">("all");
  const effectiveCanEdit = canEdit && !locked;

  const visiblePlayers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return players.filter((player) => {
      const record = records.find((item) => item.playerId === player.id);
      const matchesStatus = statusFilter === "all" || record?.status === statusFilter;
      const matchesQuery = !normalized || `${player.firstName} ${player.lastName}`.toLowerCase().includes(normalized);
      return matchesStatus && matchesQuery;
    });
  }, [players, query, records, statusFilter]);

  function updateRecord(record: AttendanceRecord) {
    onRecordsChange(records.map((item) => item.id === record.id ? record : item));
  }

  function setAll(status: AttendanceStatus) {
    if (!effectiveCanEdit) return;
    onRecordsChange(records.map((record) => ({
      ...record,
      status,
      reason: status === "present" ? "" : record.reason,
      delayMinutes: status === "late" ? record.delayMinutes : 0,
      arrivalDelayMinutes: status === "late" ? record.arrivalDelayMinutes : 0,
      injuryNote: status === "injured" ? record.injuryNote : "",
      injuryDetails: status === "injured" ? record.injuryDetails : "",
      updatedAt: new Date().toISOString(),
    })));
  }

  return (
    <section className="attendance-card attendance-call-sheet">
      <div className="attendance-section-title attendance-call-title">
        <div>
          <span>Appel rapide</span>
          <h2>Statuts joueurs</h2>
        </div>
        <strong>{lastSavedAt ? `Sauvegardé à ${lastSavedAt}` : "Autosave actif"}</strong>
      </div>

      <div className="attendance-toolbar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un joueur" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AttendanceStatus | "all")}>
          <option value="all">Tous statuts</option>
          {attendanceStatuses.map((status) => <option key={status} value={status}>{getAttendanceStatusLabel(status)}</option>)}
        </select>
        <button type="button" disabled={!effectiveCanEdit} onClick={() => setAll("present")}>Tout le monde présent</button>
        <button type="button" disabled={!effectiveCanEdit} onClick={() => setAll("absent_unexcused")}>Tout non excusé</button>
        <button type="button" disabled={!effectiveCanEdit} onClick={onReset}>Réinitialiser appel</button>
        <button type="button" disabled={!effectiveCanEdit} onClick={onCopyPrevious}>Copier séance précédente</button>
        <button type="button" disabled={!canEdit} onClick={onSave}>Sauvegarder</button>
        <button type="button" disabled={!canEdit} onClick={onLock}>{locked ? "Appel validé" : "Valider appel coach"}</button>
      </div>

      <div className="attendance-table-scroll">
        <table className="bcvb-table-premium attendance-table">
          <thead>
            <tr>
              <th>Joueur</th>
              <th>Statut rapide</th>
              <th>Statut</th>
              <th>Motif</th>
              <th>Retard</th>
              <th>Commentaire coach</th>
              <th>Mise à jour</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {visiblePlayers.map((player) => {
              const record = records.find((item) => item.playerId === player.id);
              if (!record) return null;
              return (
                <AttendancePlayerRow
                  key={player.id}
                  player={player}
                  record={record}
                  canEdit={effectiveCanEdit}
                  canViewNotes={canViewNotes}
                  onChange={updateRecord}
                />
              );
            })}
            {visiblePlayers.length === 0 && <tr><td colSpan={8}>Aucun joueur ne correspond au filtre.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
