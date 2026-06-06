import type { TeamProfile } from "../../types/teams";

export function TeamArchivePanel({
  team,
  canArchive,
  canDelete,
  onChange,
}: {
  team: TeamProfile;
  canArchive: boolean;
  canDelete: boolean;
  onChange: (team: TeamProfile) => void;
}) {
  const isArchived = team.status === "archived" || team.status === "archive";

  function patchStatus(status: TeamProfile["status"]) {
    onChange({ ...team, status, updatedAt: new Date().toISOString() });
  }

  return (
    <section className="team-archive-panel">
      <div className="teams-section-title">
        <span>Archivage sécurisé</span>
        <h2>Fin de saison</h2>
      </div>
      <p>Archiver conserve la fiche, les objectifs, documents liés et historiques. La suppression reste réservée à l’admin.</p>
      <div className="team-history-actions">
        {isArchived ? (
          <button type="button" disabled={!canArchive} onClick={() => patchStatus("actif")}>Réactiver l’équipe</button>
        ) : (
          <button type="button" disabled={!canArchive} onClick={() => patchStatus("archive")}>Archiver l’équipe</button>
        )}
        <button type="button" disabled={!canDelete} onClick={() => window.alert("Suppression protégée : ajoutez une raison et validez côté administration.")}>Supprimer</button>
      </div>
      {!canArchive && <p className="team-muted-note">Archivage réservé à l’admin, dirigeant ou responsable technique.</p>}
    </section>
  );
}

