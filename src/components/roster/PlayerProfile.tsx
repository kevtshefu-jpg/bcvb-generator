import type { PlayerPassport, RosterPermissionSet } from "../../types/roster";

export function PlayerProfile({
  passport,
  permissions,
}: {
  passport: PlayerPassport | null;
  permissions: RosterPermissionSet;
}) {
  if (!passport) {
    return (
      <aside className="bcvb-tool-card roster-player-profile">
        <div className="roster-section-header">
          <div>
            <span>Fiche joueur</span>
            <h2>Passeport BCVB</h2>
          </div>
        </div>
        <p>Sélectionne un joueur dans la prévisualisation ou les fiches joueurs.</p>
      </aside>
    );
  }

  return (
    <aside className="bcvb-tool-card roster-player-profile">
      <div className="roster-section-header">
        <div>
          <span>Fiche joueur</span>
          <h2>{passport.player.firstName} {passport.player.lastName}</h2>
        </div>
        <span className="roster-chip">{passport.player.status}</span>
      </div>
      <dl className="roster-profile-list">
        <div><dt>Naissance</dt><dd>{passport.player.birthDate || "Non renseignée"}</dd></div>
        <div><dt>Catégorie</dt><dd>{passport.player.category || "À classer"}</dd></div>
        <div><dt>Licence</dt><dd>{passport.player.licenseNumber || "À compléter"}</dd></div>
        <div><dt>Équipe principale</dt><dd>{passport.memberships.find((membership) => membership.isPrimaryTeam)?.teamId || "À affecter"}</dd></div>
        <div><dt>Présence</dt><dd>{passport.attendanceRate ?? 0}% · {passport.absencesCount ?? 0} absence(s)</dd></div>
        <div><dt>Évaluations</dt><dd>{passport.evaluationSummary || "À compléter"}</dd></div>
      </dl>
      <section>
        <h3>Contacts familles</h3>
        {passport.contacts.map((contact) => (
          <p key={contact.id}>
            {contact.relation} · {contact.firstName} {contact.lastName} · {permissions.canViewSensitiveContacts ? `${contact.email || "—"} · ${contact.phone || "—"}` : "coordonnées masquées"}
          </p>
        ))}
        {passport.contacts.length === 0 && <p>Aucun contact famille.</p>}
      </section>
      <section>
        <h3>Liens sportifs préparés</h3>
        <div className="roster-profile-links">
          <span>Présences / absences</span>
          <span>Évaluations joueurs</span>
          <span>Séances</span>
          <span>Planifications</span>
          <span>Documents BCVB</span>
        </div>
      </section>
      <section>
        <h3>Notes</h3>
        <p>Coach : {passport.coachNotes || "À renseigner"}</p>
        <p>Responsable technique : {passport.technicalManagerNotes || "À renseigner"}</p>
      </section>
      <div className="coach-actions">
        <button className="bcvb-button-secondary" type="button" disabled={!permissions.canArchivePlayer}>Archiver joueur</button>
        <button className="bcvb-button-secondary" type="button" disabled={!permissions.canDeletePlayer}>Supprimer joueur</button>
      </div>
    </aside>
  );
}

