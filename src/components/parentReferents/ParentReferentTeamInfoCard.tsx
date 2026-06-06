import type { ParentReferentTeamInfo } from "../../types/parentReferent";

export function ParentReferentTeamInfoCard({ teamInfo }: { teamInfo: ParentReferentTeamInfo }) {
  return (
    <section className="parent-referent-section parent-referent-team-card">
      <div className="parent-referent-section__title">
        <span>Informations équipe</span>
        <h2>{teamInfo.teamName}</h2>
      </div>
      <strong className="parent-referent-status-badge">Lecture logistique uniquement</strong>

      <div className="parent-referent-info-grid">
        <article><span>Catégorie</span><strong>{teamInfo.category}</strong></article>
        <article><span>Niveau</span><strong>{teamInfo.level || "À confirmer"}</strong></article>
        <article><span>Saison</span><strong>{teamInfo.season}</strong></article>
        <article><span>Coach principal</span><strong>{teamInfo.headCoachName}</strong></article>
        <article><span>Coach adjoint</span><strong>{teamInfo.assistantCoachNames?.join(" · ") || "À confirmer"}</strong></article>
        <article><span>Parent référent</span><strong>{teamInfo.parentReferentName || "À nommer"}</strong></article>
      </div>

      <div className="parent-referent-slot-list">
        {teamInfo.trainingSlots.map((slot) => (
          <article key={slot.id}>
            <strong>{slot.day}</strong>
            <span>{slot.startTime} - {slot.endTime}</span>
            <small>{slot.gym}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
