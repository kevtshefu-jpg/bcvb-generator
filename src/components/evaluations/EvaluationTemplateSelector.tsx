import { getAvailableEvaluationTemplates } from "../../lib/evaluations/evaluationTemplates";

export function EvaluationTemplateSelector({
  category,
  level,
  disabled,
  onChange,
  onLoadTemplate,
}: {
  category: string;
  level: string;
  disabled?: boolean;
  onChange: (patch: Partial<{ category: string; level: string }>) => void;
  onLoadTemplate: () => void;
}) {
  const templates = getAvailableEvaluationTemplates();
  const categories = [...new Set(templates.map((template) => template.category))];
  const levels = [...new Set(templates.filter((template) => template.category === category).map((template) => template.level || "BCVB"))];
  const currentTemplate = templates.find((template) => template.category === category && (!level || template.level === level))
    || templates.find((template) => template.category === category)
    || templates[0];

  return (
    <section className="evaluation-card evaluation-template-selector">
      <div className="evaluations-section-title">
        <span>Sélecteur de grille</span>
        <h2>{currentTemplate?.title || "Grille BCVB"}</h2>
      </div>
      <div className="evaluation-selector-grid">
        <label>
          Catégorie
          <select disabled={disabled} value={category} onChange={(event) => onChange({ category: event.target.value })}>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          Niveau
          <select disabled={disabled} value={level} onChange={(event) => onChange({ level: event.target.value })}>
            {levels.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          Modèle
          <input disabled value={currentTemplate?.description || "Modèle club"} />
        </label>
      </div>
      <button className="bcvb-button-primary" type="button" disabled={disabled} onClick={onLoadTemplate}>Charger template</button>
    </section>
  );
}

