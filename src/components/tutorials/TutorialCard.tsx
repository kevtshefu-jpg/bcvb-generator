import type { TutorialItem } from "../../types/tutorials";
import { tutorialAudienceLabels, tutorialCategoryLabels } from "../../lib/tutorials/tutorialData";

type TutorialCardProps = {
  tutorial: TutorialItem;
  active: boolean;
  completion: number;
  onSelect: (tutorialId: string) => void;
};

function getPriorityLabel(priority: TutorialItem["priority"]) {
  if (priority === "haute") return "Priorité haute";
  if (priority === "moyenne") return "Priorité moyenne";
  return "Priorité basse";
}

export default function TutorialCard({ tutorial, active, completion, onSelect }: TutorialCardProps) {
  return (
    <button
      type="button"
      className={active ? "tutorial-card tutorial-card--active" : "tutorial-card"}
      onClick={() => onSelect(tutorial.id)}
      aria-pressed={active}
    >
      <span className="tutorial-card__category">{tutorialCategoryLabels[tutorial.category]}</span>
      <span className={`tutorial-card__priority tutorial-card__priority--${tutorial.priority}`}>
        {getPriorityLabel(tutorial.priority)}
      </span>

      <strong>{tutorial.title}</strong>
      <span className="tutorial-card__subtitle">{tutorial.subtitle}</span>

      <span className="tutorial-card__meta">
        {tutorial.estimatedTime} · {tutorial.level} · impact {tutorial.impact}
      </span>

      <span className="tutorial-card__audiences">
        {tutorial.audience.map((audience) => (
          <span key={audience}>{tutorialAudienceLabels[audience]}</span>
        ))}
      </span>

      <span className="tutorial-card__progress" aria-label={`Progression ${completion}%`}>
        <span style={{ width: `${completion}%` }} />
      </span>
    </button>
  );
}
