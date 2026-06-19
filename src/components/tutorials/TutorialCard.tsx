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
  const priorityClass = tutorial.priority === "moyenne" ? "is-medium" : "";

  return (
    <button
      type="button"
      className={
        active
          ? "tutorial-card tutorial-card--active platform-tutorial-card"
          : "tutorial-card platform-tutorial-card"
      }
      onClick={() => onSelect(tutorial.id)}
      aria-pressed={active}
    >
      <span className="tutorial-card__category platform-tutorial-card__category">
        {tutorialCategoryLabels[tutorial.category]}
      </span>
      <span className={`tutorial-card__priority tutorial-card__priority--${tutorial.priority} platform-tutorial-card__priority ${priorityClass}`}>
        {getPriorityLabel(tutorial.priority)}
      </span>

      <strong className="platform-tutorial-card__title">{tutorial.title}</strong>
      <span className="tutorial-card__subtitle platform-tutorial-card__description">
        {tutorial.subtitle}
      </span>

      <span className="tutorial-card__meta platform-tutorial-card__meta">
        {tutorial.estimatedTime} · {tutorial.level} · impact {tutorial.impact}
      </span>

      <span className="tutorial-card__audiences platform-tutorial-card__roles">
        {tutorial.audience.map((audience) => (
          <span className="platform-tutorial-card__role" key={audience}>
            {tutorialAudienceLabels[audience]}
          </span>
        ))}
      </span>

      <span className="tutorial-card__progress platform-tutorial-card__progress" aria-label={`Progression ${completion}%`}>
        <span style={{ width: `${completion}%` }} />
      </span>
    </button>
  );
}
