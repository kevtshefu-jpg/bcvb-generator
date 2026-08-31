import { useMemo, useState } from "react";
import type { AttendancePlayer, AttendanceRecord, AttendanceStatus } from "../../types/attendance";
import { attendanceStatuses, getAttendanceStatusLabel } from "../../lib/attendance/attendanceScoring";
import { AttendancePlayerCard, AttendancePlayerRow } from "./AttendancePlayerRow";
import { EmptyState } from "../ui/ResponsiveDataView";

export function AttendanceCallSheet({
  players,
  records,
  locked,
  canEdit,
  canViewNotes,
  lastSavedAt,
  onRecordsChange,
  onCreateRecord,
  onBulkStatus,
  onSave,
  onReset,
  onCopyPrevious,
  onLock,
  mutationLoading = false,
}: {
  players: AttendancePlayer[];
  records: AttendanceRecord[];
  locked?: boolean;
  canEdit: boolean;
  canViewNotes: boolean;
  lastSavedAt?: string;
  onRecordsChange: (records: AttendanceRecord[]) => void;
  onCreateRecord: (playerId: string, status: AttendanceStatus) => void;
  onBulkStatus: (status: AttendanceStatus) => void;
  onSave: () => void;
  onReset: () => void;
  onCopyPrevious: () => void;
  onLock: () => void;
  mutationLoading?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | "all">("all");
  const effectiveCanEdit = canEdit && !locked && !mutationLoading;

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
    onBulkStatus(status);
  }

  return (
    <section className="attendance-card attendance-call-sheet">
      <div className="attendance-section-title attendance-call-title">
        <div>
          <span>Appel rapide</span>
          <h2>Statuts joueurs</h2>
        </div>
        <strong>{lastSavedAt ? `Enregistré à ${lastSavedAt}` : "Brouillon local actif"}</strong>
      </div>

      <div className="attendance-toolbar">
        <div className="attendance-toolbar__primary" aria-label="Actions principales">
          <button className="attendance-action-primary" type="button" disabled={!canEdit || Boolean(locked) || mutationLoading} onClick={onSave}>Sauvegarder</button>
          <button className="attendance-action-validate" type="button" disabled={!canEdit || Boolean(locked) || mutationLoading} onClick={onLock}>{locked ? "Appel validé" : "Valider appel coach"}</button>
        </div>
        <div className="attendance-toolbar__entry" aria-label="Recherche et saisie rapide">
          <input aria-label="Rechercher un joueur" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un joueur" />
          <select aria-label="Filtrer par statut" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AttendanceStatus | "all")}>
            <option value="all">Tous statuts</option>
            {attendanceStatuses.map((status) => <option key={status} value={status}>{getAttendanceStatusLabel(status)}</option>)}
          </select>
          <button type="button" disabled={!effectiveCanEdit} onClick={() => setAll("present")}>Tout le monde présent</button>
        </div>
        <details className="attendance-toolbar__secondary">
          <summary>Actions secondaires</summary>
          <div>
            <button className="attendance-action-danger" type="button" disabled={!effectiveCanEdit} onClick={() => setAll("absent_unexcused")}>Tout non excusé</button>
            <button type="button" disabled={!effectiveCanEdit} onClick={onReset}>Réinitialiser appel</button>
            <button type="button" disabled={!effectiveCanEdit} onClick={onCopyPrevious}>Copier séance précédente</button>
          </div>
        </details>
      </div>

      <div className="attendance-table-scroll responsive-data-table">
        <table className="bcvb-table-premium attendance-table">
          <thead>
            <tr>
              <th>Joueur</th>
              <th>Statut rapide</th>
              <th>Motif</th>
              <th>Retard</th>
              <th>Commentaire coach</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {visiblePlayers.map((player) => {
              const record = records.find((item) => item.playerId === player.id);
              return (
                <AttendancePlayerRow
                  key={player.id}
                  player={player}
                  record={record}
                  canEdit={effectiveCanEdit}
                  canViewNotes={canViewNotes}
                  onChange={updateRecord}
                  onCreate={(status) => onCreateRecord(player.id, status)}
                />
              );
            })}
            {visiblePlayers.length === 0 && <tr><td colSpan={6}>Aucun joueur ne correspond au filtre.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="responsive-data-mobile attendance-player-card-list">
        {visiblePlayers.map((player) => {
          const record = records.find((item) => item.playerId === player.id);
          return (
            <AttendancePlayerCard
              key={player.id}
              player={player}
              record={record}
              canEdit={effectiveCanEdit}
              canViewNotes={canViewNotes}
              onChange={updateRecord}
              onCreate={(status) => onCreateRecord(player.id, status)}
            />
          );
        })}
        {visiblePlayers.length === 0 && (
          <EmptyState
            title="Aucun joueur trouvé"
            description="Modifie la recherche ou le filtre de statut pour afficher les joueurs à appeler."
          />
        )}
      </div>
    </section>
  );
}
