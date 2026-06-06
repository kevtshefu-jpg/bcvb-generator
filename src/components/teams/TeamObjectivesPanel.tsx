import type { TeamObjective, TeamObjectiveType } from "../../types/teams";
import { createCollectiveObjectiveFromEvaluation } from "../../lib/teams/teamLinks";
import { createSuggestedTeamObjective, suggestedTeamObjectives } from "../../lib/teams/teamObjectives";

const objectiveTypeLabels: Record<TeamObjectiveType, string> = {
  sportif: "Sportif",
  pedagogique: "Pédagogique",
  comportemental: "Comportemental",
  defensif: "Défensif",
  offensif: "Offensif",
  collectif: "Collectif",
  individuel_prioritaire: "Individuel prioritaire",
  identite_bcvb: "Identité BCVB",
  defense_homme_a_homme: "Défense Homme à Homme",
  style_de_jeu: "Style de jeu",
  priorite_cycle: "Priorité cycle",
  vie_de_groupe: "Vie de groupe",
};

const types = Object.keys(objectiveTypeLabels) as TeamObjectiveType[];
function criteriaToText(value?: string | string[]) {
  return Array.isArray(value) ? value.join("\n") : value || "";
}

export function TeamObjectivesPanel({
  teamId,
  season,
  objectives,
  canEdit,
  onChange,
}: {
  teamId: string;
  season: string;
  objectives: TeamObjective[];
  canEdit: boolean;
  onChange: (objectives: TeamObjective[]) => void;
}) {
  function patch(objectiveId: string, patchObjective: Partial<TeamObjective>) {
    onChange(objectives.map((objective) => objective.id === objectiveId ? { ...objective, ...patchObjective } : objective));
  }

  function addObjective() {
    onChange([...objectives, createSuggestedTeamObjective(teamId, season, objectives.length)]);
  }

  function addFromEvaluation() {
    onChange([...objectives, createCollectiveObjectiveFromEvaluation(teamId, season, "défense")]);
  }

  return (
    <section className="team-objectives-panel">
      <div className="teams-section-title">
        <span>Objectifs saison</span>
        <h2>Formation, compétition et identité club</h2>
      </div>
      <div className="team-objective-list">
        {objectives.map((objective) => (
          <article key={objective.id} className={`team-objective team-objective--${objective.priority}`}>
            <div className="team-objective-header">
              <select disabled={!canEdit} value={objective.type} onChange={(event) => patch(objective.id, { type: event.target.value as TeamObjectiveType })}>
                {types.map((type) => <option key={type} value={type}>{objectiveTypeLabels[type]}</option>)}
              </select>
              <select disabled={!canEdit} value={objective.priority} onChange={(event) => patch(objective.id, { priority: event.target.value as TeamObjective["priority"] })}>
                <option value="basse">Basse</option>
                <option value="moyenne">Moyenne</option>
                <option value="haute">Haute</option>
              </select>
              <select disabled={!canEdit} value={objective.status} onChange={(event) => patch(objective.id, { status: event.target.value as TeamObjective["status"] })}>
                <option value="a_faire">À faire</option>
                <option value="a_travailler">À travailler</option>
                <option value="en_cours">En cours</option>
                <option value="atteint">Atteint</option>
                <option value="abandonne">Archivé</option>
              </select>
            </div>
            <input disabled={!canEdit} value={objective.title} onChange={(event) => patch(objective.id, { title: event.target.value })} />
            <textarea disabled={!canEdit} value={objective.description} onChange={(event) => patch(objective.id, { description: event.target.value })} />
            <div className="team-objective-grid">
              <textarea disabled={!canEdit} value={criteriaToText(objective.observableCriteria)} onChange={(event) => patch(objective.id, { observableCriteria: event.target.value })} placeholder="Critères observables" />
              <textarea disabled={!canEdit} value={criteriaToText(objective.quantifiableCriteria)} onChange={(event) => patch(objective.id, { quantifiableCriteria: event.target.value })} placeholder="Critères quantifiables" />
              <input disabled={!canEdit} value={objective.linkedPlanningId || ""} onChange={(event) => patch(objective.id, { linkedPlanningId: event.target.value })} placeholder="Lien planification" />
            </div>
          </article>
        ))}
      </div>
      <div className="team-suggested-objectives">
        {suggestedTeamObjectives.map((item) => <span key={item.title}>{item.title}</span>)}
      </div>
      <div className="coach-actions">
        <button className="bcvb-button-secondary" type="button" disabled={!canEdit} onClick={addObjective}>Créer objectif</button>
        <button className="bcvb-button-secondary" type="button" disabled={!canEdit} onClick={addFromEvaluation}>Créer depuis évaluations</button>
      </div>
    </section>
  );
}
