import type { BCVBSession } from "../types/session";

interface Props {
  sessions: BCVBSession[];
  currentSessionId: string;
  onOpen: (session: BCVBSession) => void;
  onDuplicate: (session: BCVBSession) => void;
  onDelete: (session: BCVBSession) => void;
}

export function LibraryPanel({
  sessions,
  currentSessionId,
  onOpen,
  onDuplicate,
  onDelete,
}: Props) {
  return (
    <div className="library-panel">
      <div className="library-header">
        <h3>Bibliothèque</h3>
        <p>{sessions.length} séance(s)</p>
      </div>

      {sessions.length === 0 ? (
        <div className="library-empty">
          Aucune séance enregistrée.
        </div>
      ) : (
        <div className="library-list">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`library-item ${
                session.id === currentSessionId ? "active" : ""
              }`}
            >
              <div className="library-item-main">
                <strong>{session.title || "Sans titre"}</strong>
                <span>
                  {session.category} • {session.durationMin} min
                </span>
              </div>

              <div className="library-item-actions">
                <button onClick={() => onOpen(session)}>Ouvrir</button>
                <button onClick={() => onDuplicate(session)}>Dupliquer</button>
                <button onClick={() => onDelete(session)}>Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
