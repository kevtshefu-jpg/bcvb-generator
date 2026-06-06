import type { TeamGender, TeamProfile, TeamStatus, TeamTrainingSlot } from "../../types/teams";

const statuses: TeamStatus[] = ["active", "actif", "preparation", "draft", "brouillon", "archived", "archive"];
const genders: TeamGender[] = ["masculin", "feminin", "mixte"];

function slotToText(slot: string | TeamTrainingSlot) {
  return typeof slot === "string" ? slot : `${slot.day} ${slot.startTime}-${slot.endTime} · ${slot.gym}`;
}

export function TeamIdentityCard({
  team,
  readOnly,
  onChange,
}: {
  team: TeamProfile;
  readOnly?: boolean;
  onChange: (team: TeamProfile) => void;
}) {
  function patch(patchTeam: Partial<TeamProfile>) {
    onChange({ ...team, ...patchTeam, updatedAt: new Date().toISOString() });
  }

  return (
    <section className="team-identity-card">
      <div className="teams-section-title">
        <span>Identité équipe</span>
        <h2>{team.name}</h2>
      </div>
      <div className="team-form-grid">
        <label>Nom <input disabled={readOnly} value={team.name} onChange={(event) => patch({ name: event.target.value })} /></label>
        <label>Catégorie <input disabled={readOnly} value={team.category} onChange={(event) => patch({ category: event.target.value })} /></label>
        <label>Sexe
          <select disabled={readOnly} value={team.gender || "mixte"} onChange={(event) => patch({ gender: event.target.value as TeamGender })}>
            {genders.map((gender) => <option key={gender} value={gender}>{gender}</option>)}
          </select>
        </label>
        <label>Niveau <input disabled={readOnly} value={team.level} onChange={(event) => patch({ level: event.target.value })} /></label>
        <label>Championnat <input disabled={readOnly} value={team.championship || ""} onChange={(event) => patch({ championship: event.target.value })} /></label>
        <label>Saison <input disabled={readOnly} value={team.season} onChange={(event) => patch({ season: event.target.value })} /></label>
        <label>Salle <input disabled={readOnly} value={team.mainGym || ""} onChange={(event) => patch({ mainGym: event.target.value })} /></label>
        <label>Statut
          <select disabled={readOnly} value={team.status} onChange={(event) => patch({ status: event.target.value as TeamStatus })}>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <label className="team-form-wide">Créneaux
          <textarea disabled={readOnly} value={(team.trainingSlots || []).map(slotToText).join("\n")} onChange={(event) => patch({ trainingSlots: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) })} />
        </label>
        <label className="team-form-wide">Tags identité
          <input disabled={readOnly} value={(team.identityTags || ["Défendre Fort", "Courir", "Partager la Balle"]).join(", ")} onChange={(event) => patch({ identityTags: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} />
        </label>
        <label>Style de jeu <input disabled={readOnly} value={team.styleOfPlay || ""} onChange={(event) => patch({ styleOfPlay: event.target.value })} /></label>
        <label>Identité défensive <input disabled={readOnly} value={team.defensiveIdentity || "Défense Homme à Homme"} onChange={(event) => patch({ defensiveIdentity: event.target.value })} /></label>
        <label className="team-form-wide">Objectif principal <input disabled={readOnly} value={team.mainObjective || ""} onChange={(event) => patch({ mainObjective: event.target.value })} /></label>
        <label>Priorité technique <input disabled={readOnly} value={team.technicalPriority || ""} onChange={(event) => patch({ technicalPriority: event.target.value })} /></label>
        <label>Priorité comportementale <input disabled={readOnly} value={team.behavioralPriority || ""} onChange={(event) => patch({ behavioralPriority: event.target.value })} /></label>
        <label>Priorité collective <input disabled={readOnly} value={team.collectivePriority || ""} onChange={(event) => patch({ collectivePriority: event.target.value })} /></label>
        <label className="team-form-wide">Description
          <textarea disabled={readOnly} value={team.description || ""} onChange={(event) => patch({ description: event.target.value })} />
        </label>
      </div>
      <article className="team-bcvb-identity">
        <strong>Identité BCVB</strong>
        <p>Défendre Fort, Courir et Partager la Balle. Défense prioritaire : Homme à Homme.</p>
        <p>Axes : intensité, agressivité maîtrisée, maîtrise, jeu.</p>
        <p>Démarche : je découvre, je m’exerce, je retranscris en match, je régule.</p>
      </article>
    </section>
  );
}
