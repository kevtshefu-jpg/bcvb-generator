import type { TeamIndicators, TeamProfile, TeamStaffMember, TeamTrainingSlot } from "../../types/teams";
import { isHeadCoachRole } from "../../lib/teams/teamStaff";

function slotToText(slot: string | TeamTrainingSlot) {
  return typeof slot === "string" ? slot : `${slot.day} ${slot.startTime}-${slot.endTime} · ${slot.gym}`;
}

export function TeamProfileCard({
  team,
  staff,
  indicators,
}: {
  team: TeamProfile;
  staff: TeamStaffMember[];
  indicators: TeamIndicators;
}) {
  const headCoach = staff.find((member) => isHeadCoachRole(member.role) && member.isActive);
  const identityTags = team.identityTags?.length ? team.identityTags : ["Défendre Fort", "Courir", "Partager la Balle"];

  return (
    <section className="team-profile-card">
      <div className="teams-section-title">
        <span>Fiche équipe</span>
        <h2>{team.name}</h2>
      </div>
      <div className="team-profile-card__identity">
        <span>{team.category}</span>
        <span>{team.gender || "mixte"}</span>
        <span>{team.level}</span>
        <span>{team.season}</span>
        <span>{team.status}</span>
      </div>
      <p>{team.description || "Fiche équipe à compléter avec les priorités sportives et éducatives de la saison."}</p>
      <dl>
        <div><dt>Coach principal</dt><dd>{headCoach?.name || "À affecter"}</dd></div>
        <div><dt>Championnat</dt><dd>{team.championship || "À renseigner"}</dd></div>
        <div><dt>Salle principale</dt><dd>{team.mainGym || "À renseigner"}</dd></div>
        <div><dt>Créneaux</dt><dd>{team.trainingSlots?.map(slotToText).join(" / ") || "À renseigner"}</dd></div>
        <div><dt>Joueurs suivis</dt><dd>{indicators.playersCount}</dd></div>
      </dl>
      <div className="team-profile-card__tags">
        {identityTags.map((tag) => <span key={tag}>{tag}</span>)}
      </div>
    </section>
  );
}

