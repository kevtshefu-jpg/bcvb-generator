const DEFAULT_TAGS = [
  "Fixer défenseur",
  "Attaquer panier",
  "Créer avantage",
  "Lire aide",
];

export interface ObjectifPanelState {
  objectif: string;
  tags: string[];
}

interface Props extends ObjectifPanelState {
  tagOptions?: string[];
  onChange: (patch: Partial<ObjectifPanelState>) => void;
}

export function ObjectifPanel({ objectif, tags, tagOptions = DEFAULT_TAGS, onChange }: Props) {
  function toggleTag(tag: string) {
    const next = tags.includes(tag)
      ? tags.filter((t) => t !== tag)
      : [...tags, tag];
    onChange({ tags: next });
  }

  return (
    <div className="bcvb-panel">
      <div className="bcvb-panel-title">Objectif</div>

      <div className="bcvb-form-stack">
        <div className="bcvb-label-block">
          <span>Objectif principal</span>
          <textarea
            className="bcvb-textarea"
            value={objectif}
            onChange={(e) => onChange({ objectif: e.target.value })}
            placeholder="Objectif principal..."
          />
        </div>

        <div className="bcvb-label-block">
          <span>Intentions</span>
          <div className="bcvb-tag-selector">
            {tagOptions.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`bcvb-chip${tags.includes(tag) ? ' bcvb-chip--active' : ''}`}
                onClick={() => toggleTag(tag)}
                aria-pressed={tags.includes(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
