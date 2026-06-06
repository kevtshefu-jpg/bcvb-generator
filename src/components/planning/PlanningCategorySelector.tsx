import type { CoachProfile, PlanningBuilderInput, PlanningCategory, PlanningLevel } from "../../types/planning";
import { coachProfiles, planningCategories, planningLevels } from "../../lib/planning/planningStandards";

type PlanningCategorySelectorProps = {
  input: PlanningBuilderInput;
  onChange: (input: PlanningBuilderInput) => void;
  onGenerate: () => void;
  readOnly?: boolean;
};

function updateList(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function PlanningCategorySelector({ input, onChange, onGenerate, readOnly }: PlanningCategorySelectorProps) {
  return (
    <section className="planning-card planning-selector">
      <div className="planning-section-title">
        <span>Construction</span>
        <h2>Paramètres sportifs</h2>
      </div>
      <div className="planning-selector-grid">
        <label>
          Équipe
          <input disabled={readOnly} value={input.teamName} onChange={(event) => onChange({ ...input, teamName: event.target.value })} placeholder="U13 Masculins 1" />
        </label>
        <label>
          Saison
          <input disabled={readOnly} value={input.season} onChange={(event) => onChange({ ...input, season: event.target.value })} placeholder="2026-2027" />
        </label>
        <label>
          Catégorie
          <select disabled={readOnly} value={input.category} onChange={(event) => onChange({ ...input, category: event.target.value as PlanningCategory })}>
            {planningCategories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>
        <label>
          Niveau
          <select disabled={readOnly} value={input.level} onChange={(event) => onChange({ ...input, level: event.target.value as PlanningLevel })}>
            {planningLevels.map((level) => <option key={level}>{level}</option>)}
          </select>
        </label>
        <label>
          Profil coach
          <select disabled={readOnly} value={input.coachProfile} onChange={(event) => onChange({ ...input, coachProfile: event.target.value as CoachProfile })}>
            {coachProfiles.map((profile) => <option key={profile}>{profile}</option>)}
          </select>
        </label>
        <label>
          Fréquence / semaine
          <input disabled={readOnly} type="number" min="1" max="6" value={input.trainingFrequencyPerWeek} onChange={(event) => onChange({ ...input, trainingFrequencyPerWeek: Number(event.target.value) || 1 })} />
        </label>
        <label>
          Niveau championnat
          <input disabled={readOnly} value={input.matchLevel} onChange={(event) => onChange({ ...input, matchLevel: event.target.value })} placeholder="Région, D1, RF3..." />
        </label>
        <label className="planning-selector-wide">
          Contraintes
          <textarea disabled={readOnly} value={input.constraints.join("\n")} onChange={(event) => onChange({ ...input, constraints: updateList(event.target.value) })} placeholder="Créneaux, gymnase, effectif, stages, examens..." />
        </label>
      </div>
      {!readOnly && <button className="planning-primary" type="button" onClick={onGenerate}>Générer / adapter la planification</button>}
    </section>
  );
}
