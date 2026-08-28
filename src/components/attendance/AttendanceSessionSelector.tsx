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
  sessions,
  teams,
  selectedTeamId,
  disabled,
  onTeamChange,
  onSessionChange,
  onCreateSession,
}: {
  session: AttendanceSession | null;
  sessions: AttendanceSession[];
  teams: AttendanceTeam[];
  selectedTeamId: string;
  disabled?: boolean;
  onTeamChange: (teamId: string) => void;
  onSessionChange: (sessionId: string) => void;
  onCreateSession: () => void;
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
          <select
            disabled={disabled}
            value={selectedTeamId}
            onChange={(event) => onTeamChange(event.target.value)}
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Appel
          <select
            disabled={disabled || sessions.length === 0}
            value={session?.id || ""}
            onChange={(event) => onSessionChange(event.target.value)}
          >
            {sessions.length === 0 && (
              <option value="">Aucune séance</option>
            )}

            {sessions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.date} · {item.title}
              </option>
            ))}
          </select>
        </label>

        {session && (
          <dl>
            <div>
              <dt>Date</dt>
              <dd>{session.date}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{sessionTypes.find((type) => type.value === session.type)?.label ?? session.type}</dd>
            </div>
            <div>
              <dt>Séance</dt>
              <dd>{session.title}</dd>
            </div>
            <div>
              <dt>Début</dt>
              <dd>{session.startTime || "Non renseigné"}</dd>
            </div>
            <div>
              <dt>Lieu</dt>
              <dd>{session.location || "Non renseigné"}</dd>
            </div>
          </dl>
        )}
      </div>

      <button
        className="attendance-create-call"
        type="button"
        disabled={disabled || !selectedTeamId}
        onClick={onCreateSession}
      >
        Créer un appel
      </button>
    </section>
  );
}
