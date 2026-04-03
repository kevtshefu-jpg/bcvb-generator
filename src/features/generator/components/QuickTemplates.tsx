import { quickTemplates } from "../../../data/quickTemplates";
import type { GeneratorState } from "../../../types/generator";

type Props = {
  onApply: (patch: Partial<GeneratorState>) => void;
};

export function QuickTemplates({ onApply }: Props) {
  return (
    <div className="bcvb-card">
      <div className="bcvb-card__title">Templates rapides</div>
      <div className="bcvb-stack">
        {quickTemplates.map((template) => (
          <button
            key={template.name}
            type="button"
            className="bcvb-secondary"
            onClick={() => onApply(template.build())}
          >
            {template.name}
          </button>
        ))}
      </div>
    </div>
  );
}
