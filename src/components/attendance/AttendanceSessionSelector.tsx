import type { AttendanceSession, AttendanceSessionType, AttendanceTeam } from "../../types/attendance";

const sessionTypes: Array<{ value: AttendanceSessionType; label: string }> = [
  { value: "entrainement", label: "Entraînement" },
  { value: "match", label: "Match" },
  { value: "stage", label: "Stage" },
  { value: "tournoi", label: "Tournoi" },
  { value: "reunion", label: "Réunion" },
  { value: "autre", label: "Autre" },
  { value: "evenement_club", label: "Événement club" },
];

export function AttendanceSessionSelector({
  session,
  teams,
  disabled,
  onChange,
}: {
  session: AttendanceSession;
  teams: AttendanceTeam[];
  disabled?: boolean;
  onChange: (session: AttendanceSession) => void;
}) {
  return (
    <section className="attendance-card attendance-session-selector">
      <div className="attendance-section-title">
        <span>Séance</span>
        <h2>Équipe, date et contexte</h2>
      </div>
      <div className="attendance-selector-grid">
        <label>
          Équipe
          <select disabled={disabled} value={session.teamId} onChange={(event) => onChange({ ...session, teamId: event.target.value, updatedAt: new Date().toISOString() })}>
            {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select>
        </label>
        <label>
          Date
          <input disabled={disabled} type="date" value={session.date} onChange={(event) => onChange({ ...session, date: event.target.value, updatedAt: new Date().toISOString() })} />
        </label>
        <label>
          Type
          <select disabled={disabled} value={session.type} onChange={(event) => onChange({ ...session, type: event.target.value as AttendanceSessionType, updatedAt: new Date().toISOString() })}>
            {sessionTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
        </label>
        <label>
          Séance
          <input disabled={disabled} value={session.title} onChange={(event) => onChange({ ...session, title: event.target.value, updatedAt: new Date().toISOString() })} />
        </label>
        <label>
          Début
          <input disabled={disabled} type="time" value={session.startTime || ""} onChange={(event) => onChange({ ...session, startTime: event.target.value, updatedAt: new Date().toISOString() })} />
        </label>
        <label>
          Lieu
          <input disabled={disabled} value={session.location || ""} onChange={(event) => onChange({ ...session, location: event.target.value, updatedAt: new Date().toISOString() })} placeholder="Gymnase" />
        </label>
      </div>
      <button
        className="attendance-create-call"
        type="button"
        disabled={disabled}
        onClick={() => onChange({ ...session, title: session.title || "Nouvel appel séance", updatedAt: new Date().toISOString() })}
      >
        Créer séance d’appel
      </button>
    </section>
  );
}
