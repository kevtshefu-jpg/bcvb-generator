import type { DirigeantOrganisationSummary } from "../../types/dirigeants";

export function DirigeantOrganisationPanel({ organisation }: { organisation: DirigeantOrganisationSummary[] }) {
  return (
    <section className="dirigeant-section">
      <div className="dirigeant-section__title">
        <span>Organisation</span>
        <h2>Équipes, créneaux et référents</h2>
      </div>

      <div className="dirigeant-organisation-grid">
        {organisation.map((team) => (
          <article key={team.teamId} className="dirigeant-card dirigeant-organisation-card">
            <header>
              <div>
                <span>{team.category} · {team.level}</span>
                <h3>{team.teamName}</h3>
              </div>
              <strong>{team.playersCount} joueurs</strong>
            </header>
            <dl>
              <div><dt>Salle</dt><dd>{team.mainGym}</dd></div>
              <div><dt>Créneaux</dt><dd>{team.trainingSlots.join(" · ")}</dd></div>
              <div><dt>Coach principal</dt><dd>{team.headCoach}</dd></div>
              <div><dt>Coach adjoint</dt><dd>{team.assistantCoach || "À confirmer"}</dd></div>
              <div><dt>Parent référent</dt><dd>{team.parentReferent || "À nommer"}</dd></div>
              <div><dt>Dirigeant référent</dt><dd>{team.dirigeantReferent || "À nommer"}</dd></div>
            </dl>
            <p>{team.notes}</p>
            <div className="dirigeant-chip-row">
              {team.materialNeeds.map((item) => <span key={item}>{item}</span>)}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
