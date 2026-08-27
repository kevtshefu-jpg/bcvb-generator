import { Link } from "react-router-dom";
import type { AttendancePlayer, AttendanceRecord } from "../../types/attendance";
import {
  attendanceStatuses,
  getAttendanceStatusLabel,
  requiresAttendanceReason,
  validateAttendanceRecord,
} from "../../lib/attendance/attendanceScoring";
import { AttendanceStatusBadge } from "./AttendanceStatusBadge";

const priorityStatuses = attendanceStatuses.filter((status) =>
  ["present", "absent_excused", "absent_unexcused", "late", "injured"].includes(status)
);
const secondaryStatuses = attendanceStatuses.filter((status) =>
  !priorityStatuses.includes(status)
);

type AttendancePlayerRowProps = {
  player: AttendancePlayer;
  record?: AttendanceRecord;
  canEdit: boolean;
  canViewNotes: boolean;
  onChange: (record: AttendanceRecord) => void;
  onCreate: (status: AttendanceRecord["status"]) => void;
};

function UnrecordedStatusControls({
  canEdit,
  onCreate,
}: {
  canEdit: boolean;
  onCreate: (status: AttendanceRecord["status"]) => void;
}) {
  return (
    <div className="attendance-status-controls">
      <div className="attendance-status-quick" aria-label="Statuts prioritaires">
        {priorityStatuses.map((status) => (
          <button
            key={status}
            type="button"
            disabled={!canEdit}
            onClick={() => onCreate(status)}
          >
            {getAttendanceStatusLabel(status)}
          </button>
        ))}
      </div>
      {secondaryStatuses.length > 0 && (
        <label className="attendance-status-secondary">
          <span>Autres statuts</span>
          <select
            aria-label="Autres statuts"
            disabled={!canEdit}
            value=""
            onChange={(event) => {
              if (event.target.value) {
                onCreate(event.target.value as AttendanceRecord["status"]);
              }
            }}
          >
            <option value="">Choisir</option>
            {secondaryStatuses.map((status) => (
              <option key={status} value={status}>{getAttendanceStatusLabel(status)}</option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}

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

function AttendanceStatusControls({
  record,
  canEdit,
  onStatusChange,
}: {
  record: AttendanceRecord;
  canEdit: boolean;
  onStatusChange: (status: AttendanceRecord["status"]) => void;
}) {
  const secondaryValue = secondaryStatuses.includes(record.status)
    ? record.status
    : "";

  return (
    <div className="attendance-status-controls">
      <div className="attendance-status-quick" aria-label="Statuts prioritaires">
        {priorityStatuses.map((status) => (
          <button
            key={status}
            type="button"
            disabled={!canEdit}
            className={record.status === status ? "is-active" : ""}
            onClick={() => onStatusChange(status)}
          >
            {getAttendanceStatusLabel(status)}
          </button>
        ))}
      </div>
      {secondaryStatuses.length > 0 && (
        <label className="attendance-status-secondary">
          <span>Autres statuts</span>
          <select
            disabled={!canEdit}
            value={secondaryValue}
            onChange={(event) => {
              if (event.target.value) {
                onStatusChange(event.target.value as AttendanceRecord["status"]);
              }
            }}
          >
            <option value="">Choisir</option>
            {secondaryStatuses.map((status) => (
              <option key={status} value={status}>{getAttendanceStatusLabel(status)}</option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}

export function AttendancePlayerRow({
  player,
  record,
  canEdit,
  canViewNotes,
  onChange,
  onCreate,
}: AttendancePlayerRowProps) {
  if (!record) {
    return (
      <tr className="attendance-player-row attendance-player-row--unrecorded">
        <td>
          <strong>{player.firstName} {player.lastName}</strong>
          <span>{player.teamName || "Équipe"} · {player.category || "Catégorie"}</span>
          <strong className="attendance-muted">Non renseigné</strong>
        </td>
        <td><UnrecordedStatusControls canEdit={canEdit} onCreate={onCreate} /></td>
        <td className="attendance-muted">Non renseigné</td>
        <td className="attendance-muted">Non renseigné</td>
        <td className="attendance-muted">{canViewNotes ? "Non renseigné" : "Masqué"}</td>
        <td><Link to="/effectifs" className="attendance-link-button">Fiche joueur</Link></td>
      </tr>
    );
  }
  const currentRecord = record;
  const { delay, warnings, historyLabel } = getAttendanceRowState(record);

  function patch(patchRecord: Partial<AttendanceRecord>) {
    onChange({
      ...currentRecord,
      ...patchRecord,
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <tr className={`attendance-player-row ${warnings.length ? "has-warning" : ""}`}>
      <td>
        <strong>{player.firstName} {player.lastName}</strong>
        <span>{player.teamName || "Équipe"} · {player.category || "Catégorie"}</span>
        <AttendanceStatusBadge status={record.status} />
        <small className={`attendance-history-indicator attendance-history-indicator--${historyLabel.replace(/\s+/g, "-")}`}>{historyLabel}</small>
      </td>
      <td>
        <AttendanceStatusControls
          record={record}
          canEdit={canEdit}
          onStatusChange={(status) => patch({ status, reason: status === "present" ? "" : record.reason })}
        />
      </td>
      <td>
        {requiresAttendanceReason(record.status) && (
          <input
            disabled={!canEdit}
            value={record.reason || ""}
            onChange={(event) => patch({ reason: event.target.value })}
            placeholder="Motif requis"
          />
        )}
        {warnings.length > 0 && <small>{warnings.join(" ")}</small>}
      </td>
      <td>
        {record.status === "late" && (
          <input
            disabled={!canEdit}
            type="number"
            min="0"
            value={delay || ""}
            onChange={(event) => patch({ delayMinutes: Number(event.target.value) || 0, arrivalDelayMinutes: Number(event.target.value) || 0 })}
            placeholder="min"
          />
        )}
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
      <td><Link to="/effectifs" className="attendance-link-button">Fiche joueur</Link></td>
    </tr>
  );
}

export function AttendancePlayerCard({
  player,
  record,
  canEdit,
  canViewNotes,
  onChange,
  onCreate,
}: AttendancePlayerRowProps) {
  if (!record) {
    return (
      <article className="attendance-player-card attendance-player-card--unrecorded">
        <header>
          <div>
            <strong>{player.firstName} {player.lastName}</strong>
            <span>{player.teamName || "Équipe"} · {player.category || "Catégorie"}</span>
          </div>
          <strong className="attendance-muted">Non renseigné</strong>
        </header>
        <UnrecordedStatusControls canEdit={canEdit} onCreate={onCreate} />
        <Link to="/effectifs" className="attendance-link-button">Fiche joueur</Link>
      </article>
    );
  }
  const currentRecord = record;
  const { delay, warnings, historyLabel } = getAttendanceRowState(record);

  function patch(patchRecord: Partial<AttendanceRecord>) {
    onChange({
      ...currentRecord,
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

      <AttendanceStatusControls
        record={record}
        canEdit={canEdit}
        onStatusChange={(status) => patch({ status, reason: status === "present" ? "" : record.reason })}
      />

      {requiresAttendanceReason(record.status) && (
        <label>
          <span>Motif</span>
          <input
            disabled={!canEdit}
            value={record.reason || ""}
            onChange={(event) => patch({ reason: event.target.value })}
            placeholder="Motif requis"
          />
        </label>
      )}
      {warnings.length > 0 && <small className="attendance-player-card__warning">{warnings.join(" ")}</small>}

      <div className="attendance-player-card__grid">
        {record.status === "late" && (
          <label>
            <span>Retard</span>
            <input
              disabled={!canEdit}
              type="number"
              min="0"
              value={delay || ""}
              onChange={(event) => patch({ delayMinutes: Number(event.target.value) || 0, arrivalDelayMinutes: Number(event.target.value) || 0 })}
              placeholder="min"
            />
          </label>
        )}
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

      <Link to="/effectifs" className="attendance-link-button">Fiche joueur</Link>
    </article>
  );
}
