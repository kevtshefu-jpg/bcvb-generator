import type { TutorialItem } from "../../types/tutorials";

type TutorialChecklistProps = {
  tutorial: TutorialItem;
  completedItems: string[];
  onToggleItem: (item: string, done: boolean) => void;
};

export default function TutorialChecklist({ tutorial, completedItems, onToggleItem }: TutorialChecklistProps) {
  return (
    <section className="tutorial-detail-card tutorial-checklist-card" id="checklist">
      <div className="tutorial-section-heading">
        <p>Checklist</p>
        <h2>À vérifier avant de quitter</h2>
      </div>

      <div className="tutorial-checklist">
        {tutorial.checklist.map((item) => {
          const checked = completedItems.includes(item);

          return (
            <label key={item} className={checked ? "tutorial-check-item tutorial-check-item--done" : "tutorial-check-item"}>
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onToggleItem(item, event.target.checked)}
              />
              <span>{item}</span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
