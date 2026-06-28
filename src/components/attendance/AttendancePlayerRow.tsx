import type { AttendancePlayer, AttendanceRecord } from "../../types/attendance";
import {
  attendanceStatuses,
  getAttendanceStatusLabel,
  requiresAttendanceReason,
  validateAttendanceRecord,
} from "../../lib/attendance/attendanceScoring";
import { AttendanceStatusBadge } from "./AttendanceStatusBadge";

type AttendancePlayerRowProps = {
  player: AttendancePlayer;
  record: AttendanceRecord;
  canEdit: boolean;
  canViewNotes: boolean;
  onChange: (record: AttendanceRecord) => void;
};

function getAttendanceRowState(record: AttendanceRecord) {
  const delay = record.delayMinutes ?? record.arrivalDelayMinutes;
  const warnings = validateAttendanceRecord(record.status, record.reason, delay);
  const historyLabel = record.status === "absent_unexcused"
    ? "alerte assiduité"
    : record.status === "late" || record.status === "absent_excused"
      ? "à surveiller"
      : "régulier";

  return { delay, warnings, historyLabel };
}

export function AttendancePlayerRow({
  player,
  record,
  canEdit,
  canViewNotes,
  onChange,
}: AttendancePlayerRowProps) {
  const { delay, warnings, historyLabel } = getAttendanceRowState(record);

  function patch(patchRecord: Partial<AttendanceRecord>) {
    onChange({
      ...record,
      ...patchRecord,
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <tr className={`attendance-player-row ${warnings.length ? "has-warning" : ""}`}>
      <td>
        <strong>{player.firstName} {player.lastName}</strong>
        <span>{player.teamName || "Équipe"} · {player.category || "Catégorie"}</span>
        <small className={`attendance-history-indicator attendance-history-indicator--${historyLabel.replace(/\s+/g, "-")}`}>{historyLabel}</small>
      </td>
      <td>
        <div className="attendance-status-quick">
          {attendanceStatuses.map((status) => (
            <button
              key={status}
              type="button"
              disabled={!canEdit}
              className={record.status === status ? "is-active" : ""}
              onClick={() => patch({ status, reason: status === "present" ? "" : record.reason })}
            >
              {getAttendanceStatusLabel(status)}
            </button>
          ))}
        </div>
      </td>
      <td><AttendanceStatusBadge status={record.status} /></td>
      <td>
        <input
          disabled={!canEdit}
          value={record.reason || ""}
          onChange={(event) => patch({ reason: event.target.value })}
          placeholder={requiresAttendanceReason(record.status) ? "Motif requis" : "Motif"}
        />
        {warnings.length > 0 && <small>{warnings.join(" ")}</small>}
      </td>
      <td>
        <input
          disabled={!canEdit || record.status !== "late"}
          type="number"
          min="0"
          value={delay || ""}
          onChange={(event) => patch({ delayMinutes: Number(event.target.value) || 0, arrivalDelayMinutes: Number(event.target.value) || 0 })}
          placeholder="min"
        />
        {record.status === "injured" && (
          <input
            disabled={!canEdit}
            value={record.injuryNote || record.injuryDetails || ""}
            onChange={(event) => patch({ injuryNote: event.target.value, injuryDetails: event.target.value })}
            placeholder="Note blessure"
          />
        )}
      </td>
      <td>
        {canViewNotes ? (
          <input
            disabled={!canEdit}
            value={record.coachComment || ""}
            onChange={(event) => patch({ coachComment: event.target.value })}
            placeholder="Commentaire coach"
          />
        ) : (
          <span className="attendance-muted">Masqué</span>
        )}
      </td>
      <td>{new Date(record.updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</td>
      <td><button type="button" className="attendance-link-button">Fiche joueur</button></td>
    </tr>
  );
}

export function AttendancePlayerCard({
  player,
  record,
  canEdit,
  canViewNotes,
  onChange,
}: AttendancePlayerRowProps) {
  const { delay, warnings, historyLabel } = getAttendanceRowState(record);

  function patch(patchRecord: Partial<AttendanceRecord>) {
    onChange({
      ...record,
      ...patchRecord,
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <article className={`attendance-player-card ${warnings.length ? "has-warning" : ""}`}>
      <header>
        <div>
          <strong>{player.firstName} {player.lastName}</strong>
          <span>{player.teamName || "Équipe"} · {player.category || "Catégorie"}</span>
        </div>
        <AttendanceStatusBadge status={record.status} />
      </header>

      <small className={`attendance-history-indicator attendance-history-indicator--${historyLabel.replace(/\s+/g, "-")}`}>{historyLabel}</small>

      <div className="attendance-status-quick">
        {attendanceStatuses.map((status) => (
          <button
            key={status}
            type="button"
            disabled={!canEdit}
            className={record.status === status ? "is-active" : ""}
            onClick={() => patch({ status, reason: status === "present" ? "" : record.reason })}
          >
            {getAttendanceStatusLabel(status)}
          </button>
        ))}
      </div>

      <label>
        <span>Motif</span>
        <input
          disabled={!canEdit}
          value={record.reason || ""}
          onChange={(event) => patch({ reason: event.target.value })}
          placeholder={requiresAttendanceReason(record.status) ? "Motif requis" : "Motif"}
        />
      </label>
      {warnings.length > 0 && <small className="attendance-player-card__warning">{warnings.join(" ")}</small>}

      <div className="attendance-player-card__grid">
        <label>
          <span>Retard</span>
          <input
            disabled={!canEdit || record.status !== "late"}
            type="number"
            min="0"
            value={delay || ""}
            onChange={(event) => patch({ delayMinutes: Number(event.target.value) || 0, arrivalDelayMinutes: Number(event.target.value) || 0 })}
            placeholder="min"
          />
        </label>
        <div>
          <span>Mise à jour</span>
          <strong>{new Date(record.updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</strong>
        </div>
      </div>

      {record.status === "injured" && (
        <label>
          <span>Note blessure</span>
          <input
            disabled={!canEdit}
            value={record.injuryNote || record.injuryDetails || ""}
            onChange={(event) => patch({ injuryNote: event.target.value, injuryDetails: event.target.value })}
            placeholder="Note blessure"
          />
        </label>
      )}

      <label>
        <span>Commentaire coach</span>
        {canViewNotes ? (
          <input
            disabled={!canEdit}
            value={record.coachComment || ""}
            onChange={(event) => patch({ coachComment: event.target.value })}
            placeholder="Commentaire coach"
          />
        ) : (
          <span className="attendance-muted">Masqué</span>
        )}
      </label>

      <button type="button" className="attendance-link-button">Fiche joueur</button>
    </article>
  );
}
