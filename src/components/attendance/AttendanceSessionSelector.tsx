import type { AttendanceSession, AttendanceSessionType, AttendanceTeam } from "../../types/attendance";
import type { AttendanceOccurrence } from "../../features/attendance/attendanceOccurrences";

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
  navigationDisabled,
  canCreateOccurrence,
  onTeamChange,
  onSessionChange,
  occurrences,
  onOpenOccurrence,
}: {
  session: AttendanceSession | null;
  sessions: AttendanceSession[];
  teams: AttendanceTeam[];
  selectedTeamId: string;
  navigationDisabled?: boolean;
  canCreateOccurrence: boolean;
  onTeamChange: (teamId: string) => void;
  onSessionChange: (sessionId: string) => void;
  occurrences: AttendanceOccurrence[];
  onOpenOccurrence: (occurrence: AttendanceOccurrence) => void;
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
            disabled={navigationDisabled}
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
            disabled={navigationDisabled || sessions.length === 0}
            value={session?.id || ""}
            onChange={(event) => onSessionChange(event.target.value)}
          >
            {sessions.length === 0 && (
              <option value="">Aucune séance</option>
            )}
            {sessions.length > 0 && !session && (
              <option value="">Sélectionner un appel historique</option>
            )}

            {sessions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.date} · {item.trainingSlotId ? item.title : `Appel hors planning · ${item.title}`}
              </option>
            ))}
          </select>
        </label>

        {session && (
          <dl>
            <div>
              <dt>Contexte</dt>
              <dd>{session.trainingSlotId ? "Planning équipe" : "Appel hors planning"}</dd>
            </div>
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

      <div className="attendance-occurrences" aria-label="Occurrences du planning">
        <h3>Planning des appels</h3>
        {occurrences.length === 0 ? (
          <p>Aucune occurrence dans la période opérationnelle.</p>
        ) : occurrences.map((occurrence) => (
          <article className="attendance-occurrence" key={occurrence.id}>
            <div>
              <strong>{new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${occurrence.date}T12:00:00Z`))}</strong>
              <span>{occurrence.startTime}–{occurrence.endTime} · {occurrence.location || "Lieu non renseigné"}</span>
            </div>
            <span className="attendance-occurrence-state">
              {{ upcoming: 'À venir', missing: 'Appel à compléter', draft: 'Appel en cours', validated: 'Validé' }[occurrence.state]}
            </span>
            <button
              type="button"
              disabled={navigationDisabled || (!occurrence.session && !canCreateOccurrence)}
              onClick={() => onOpenOccurrence(occurrence)}
            >
              {occurrence.session
                ? "Afficher l’appel"
                : canCreateOccurrence
                  ? "Ouvrir l’appel"
                  : "Appel non ouvert"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
