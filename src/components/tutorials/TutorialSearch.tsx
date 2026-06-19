import type { TutorialAudience, TutorialCategory } from "../../types/tutorials";
import {
  tutorialAudienceLabels,
  tutorialAudienceOrder,
  tutorialCategoryLabels,
  tutorialCategoryOrder,
} from "../../lib/tutorials/tutorialData";

type TutorialSearchProps = {
  query: string;
  category: TutorialCategory | "all";
  audience: TutorialAudience | "all";
  visibleCount: number;
  totalCount: number;
  onQueryChange: (query: string) => void;
  onCategoryChange: (category: TutorialCategory | "all") => void;
  onAudienceChange: (audience: TutorialAudience | "all") => void;
};

export default function TutorialSearch({
  query,
  category,
  audience,
  visibleCount,
  totalCount,
  onQueryChange,
  onCategoryChange,
  onAudienceChange,
}: TutorialSearchProps) {
  return (
    <section className="tutorial-search-panel platform-tutorial-filters bcvb-card-safe" aria-label="Recherche tutoriels">
      <label className="tutorial-search-field">
        <span>Recherche</span>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Chercher un module, une action, un rôle..."
          type="search"
        />
      </label>

      <div className="tutorial-filter-row platform-tutorial-filterRow bcvb-scroll-row bcvb-tabs-safe" aria-label="Catégories tutoriels">
        <button
          type="button"
          className={
            category === "all"
              ? "tutorial-chip tutorial-chip--active platform-tutorial-filterButton bcvb-chip-safe bcvb-tab-safe is-red"
              : "tutorial-chip platform-tutorial-filterButton bcvb-chip-safe bcvb-tab-safe"
          }
          aria-pressed={category === "all"}
          onClick={() => onCategoryChange("all")}
        >
          Tous
        </button>
        {tutorialCategoryOrder.map((categoryId) => (
          <button
            type="button"
            key={categoryId}
            className={
              category === categoryId
                ? "tutorial-chip tutorial-chip--active platform-tutorial-filterButton bcvb-chip-safe bcvb-tab-safe is-red"
                : "tutorial-chip platform-tutorial-filterButton bcvb-chip-safe bcvb-tab-safe"
            }
            aria-pressed={category === categoryId}
            onClick={() => onCategoryChange(categoryId)}
          >
            {tutorialCategoryLabels[categoryId]}
          </button>
        ))}
      </div>

      <div className="tutorial-filter-row platform-tutorial-filterRow bcvb-scroll-row bcvb-tabs-safe" aria-label="Audiences tutoriels">
        <button
          type="button"
          className={
            audience === "all"
              ? "tutorial-chip tutorial-chip--dark platform-tutorial-filterButton bcvb-chip-safe bcvb-tab-safe is-active"
              : "tutorial-chip platform-tutorial-filterButton bcvb-chip-safe bcvb-tab-safe"
          }
          aria-pressed={audience === "all"}
          onClick={() => onAudienceChange("all")}
        >
          Tous rôles
        </button>
        {tutorialAudienceOrder.map((audienceId) => (
          <button
            type="button"
            key={audienceId}
            className={
              audience === audienceId
                ? "tutorial-chip tutorial-chip--dark platform-tutorial-filterButton bcvb-chip-safe bcvb-tab-safe is-active"
                : "tutorial-chip platform-tutorial-filterButton bcvb-chip-safe bcvb-tab-safe"
            }
            aria-pressed={audience === audienceId}
            onClick={() => onAudienceChange(audienceId)}
          >
            {tutorialAudienceLabels[audienceId]}
          </button>
        ))}
      </div>

      <p className="tutorial-search-count platform-tutorial-results">
        {visibleCount} tutoriel{visibleCount > 1 ? "s" : ""} affiché{visibleCount > 1 ? "s" : ""} sur {totalCount}
      </p>
    </section>
  );
}
