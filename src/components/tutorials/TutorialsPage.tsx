import { useEffect, useMemo, useState } from "react";
import type { TutorialAudience, TutorialCategory } from "../../types/tutorials";
import { useAuth } from "../../features/auth/context/AuthContext";
import {
  findTutorialById,
  tutorialAudienceLabels,
  tutorialCategoryLabels,
  tutorialItems,
} from "../../lib/tutorials/tutorialData";
import {
  computeTutorialCompletion,
  getTutorialProgress,
  setTutorialChecklistItemDone,
  setTutorialStepDone,
} from "../../lib/tutorials/tutorialProgress";
import TutorialCard from "./TutorialCard";
import TutorialChecklist from "./TutorialChecklist";
import TutorialDemoPanel from "./TutorialDemoPanel";
import TutorialQuickStart from "./TutorialQuickStart";
import TutorialRoleMatrix from "./TutorialRoleMatrix";
import TutorialSearch from "./TutorialSearch";
import TutorialStepList from "./TutorialStepList";
import { PageHeader } from "../ui/PageHeader";
import { CollapsibleSection, PageShell, StatCard } from "../ui/PageShell";
import "../../styles/tutorials.css";

type TutorialsPageProps = {
  initialCategory?: TutorialCategory;
  initialTutorialId?: string;
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeAudience(role?: string | null): TutorialAudience {
  if (role === "admin") return "admin";
  if (role === "responsable_technique") return "responsable_technique";
  if (role === "coach") return "coach";
  if (role === "dirigeant") return "dirigeant";
  if (role === "parent_referent" || role === "team_staff") return "parent_referent";
  return "membre";
}

export default function TutorialsPage({ initialCategory, initialTutorialId }: TutorialsPageProps) {
  const { profile } = useAuth();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<TutorialCategory | "all">(initialCategory ?? "all");
  const [audience, setAudience] = useState<TutorialAudience | "all">("all");
  const [selectedTutorialId, setSelectedTutorialId] = useState(() => findTutorialById(initialTutorialId).id);
  const [progress, setProgress] = useState(() => getTutorialProgress());

  const currentAudience = normalizeAudience(profile?.role);

  useEffect(() => {
    if (initialCategory) setCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    if (initialTutorialId) setSelectedTutorialId(findTutorialById(initialTutorialId).id);
  }, [initialTutorialId]);

  const visibleTutorials = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim());

    return tutorialItems.filter((tutorial) => {
      const matchesCategory = category === "all" || tutorial.category === category;
      const matchesAudience =
        audience === "all" || tutorial.audience.includes("tous") || tutorial.audience.includes(audience);
      const searchableText = normalizeText(
        [
          tutorial.title,
          tutorial.subtitle,
          tutorial.forWhat,
          tutorial.why,
          tutorial.how,
          tutorial.implementation,
          tutorialCategoryLabels[tutorial.category],
          ...tutorial.audience.map((item) => tutorialAudienceLabels[item]),
          ...tutorial.steps.map((step) => `${step.title} ${step.description}`),
          ...tutorial.checklist,
          ...tutorial.relatedRoutes,
        ].join(" ")
      );
      const matchesQuery = normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);

      return matchesCategory && matchesAudience && matchesQuery;
    });
  }, [audience, category, query]);

  useEffect(() => {
    if (visibleTutorials.length > 0 && !visibleTutorials.some((tutorial) => tutorial.id === selectedTutorialId)) {
      setSelectedTutorialId(visibleTutorials[0].id);
    }
  }, [selectedTutorialId, visibleTutorials]);

  const selectedTutorial =
    visibleTutorials.find((tutorial) => tutorial.id === selectedTutorialId) ?? findTutorialById(selectedTutorialId);
  const completion = computeTutorialCompletion(selectedTutorial, progress);
  const completedStepIds = progress.completedSteps[selectedTutorial.id] ?? [];
  const completedChecklistItems = progress.completedChecklistItems[selectedTutorial.id] ?? [];

  const stats = useMemo(() => {
    const published = tutorialItems.filter((tutorial) => tutorial.status === "publié").length;
    const highPriority = tutorialItems.filter((tutorial) => tutorial.priority === "haute").length;
    const adminModules = tutorialItems.filter((tutorial) => tutorial.audience.includes("admin")).length;
    const coachModules = tutorialItems.filter((tutorial) => tutorial.audience.includes("coach")).length;

    return [
      { label: "Tutoriels publiés", value: published },
      { label: "Priorités hautes", value: highPriority },
      { label: "Parcours admin", value: adminModules },
      { label: "Parcours coach", value: coachModules },
    ];
  }, []);

  function toggleStep(stepId: string, done: boolean) {
    setProgress((currentProgress) => setTutorialStepDone(currentProgress, selectedTutorial.id, stepId, done));
  }

  function toggleChecklistItem(item: string, done: boolean) {
    setProgress((currentProgress) =>
      setTutorialChecklistItemDone(currentProgress, selectedTutorial.id, item, done)
    );
  }

  return (
    <main className="bcvb-page tutorials-page platform-tutorial-page">
      <PageShell>
      <section id="vue-ensemble">
        <PageHeader
          eyebrow="Aide BCVB"
          title="Tutoriels d’utilisation"
          subtitle="Apprenez rapidement à utiliser les outils essentiels du club, selon votre rôle."
          action={<a className="bcvb-premium-button bcvb-premium-button--primary" href="#parcours-guide">Démarrer le parcours</a>}
          meta={<span className="bcvb-premium-status bcvb-premium-status--neutral">{tutorialAudienceLabels[currentAudience]}</span>}
        />
      </section>

      <div className="admin-registration-page__stats">
        {stats.slice(0, 4).map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </div>

      <nav className="tutorial-mobile-jumpnav" aria-label="Navigation interne tutoriels">
        <a href="#vue-ensemble">Vue d’ensemble</a>
        <a href="#parcours-guide">Parcours guidé</a>
        <a href="#checklist">Checklist</a>
        <a href="#droits-acces">Droits d’accès</a>
        <a href="#aide-faq">FAQ / aide</a>
      </nav>

      <TutorialQuickStart />

      <TutorialSearch
        query={query}
        category={category}
        audience={audience}
        visibleCount={visibleTutorials.length}
        totalCount={tutorialItems.length}
        onQueryChange={setQuery}
        onCategoryChange={setCategory}
        onAudienceChange={setAudience}
      />

      <section className="tutorial-workspace platform-tutorial-section" id="aide-faq">
        <aside className="tutorial-list-panel">
          <div className="tutorial-section-heading">
            <p>Guides disponibles</p>
            <h2>Choisir un tutoriel</h2>
          </div>

          <div className="tutorial-card-list platform-tutorial-section">
            {visibleTutorials.map((tutorial) => (
              <TutorialCard
                key={tutorial.id}
                tutorial={tutorial}
                active={tutorial.id === selectedTutorial.id}
                completion={computeTutorialCompletion(tutorial, progress)}
                onSelect={setSelectedTutorialId}
              />
            ))}
          </div>

          {visibleTutorials.length === 0 && (
            <div className="tutorial-empty-state">
              <strong>Aucun tutoriel trouvé</strong>
              <p>Change la recherche ou retire un filtre de rôle/catégorie.</p>
            </div>
          )}
        </aside>

        <div className="tutorial-detail-panel">
          <TutorialDemoPanel tutorial={selectedTutorial} completion={completion} />
          <TutorialStepList tutorial={selectedTutorial} completedStepIds={completedStepIds} onToggleStep={toggleStep} />
          <TutorialChecklist
            tutorial={selectedTutorial}
            completedItems={completedChecklistItems}
            onToggleItem={toggleChecklistItem}
          />

          <CollapsibleSection title="Ce que ce module apporte" description="Détail utile après avoir lu les étapes.">
            <p>{selectedTutorial.implementation}</p>
          </CollapsibleSection>
        </div>
      </section>

      <CollapsibleSection title="Droits d’accès par rôle" description="À consulter si vous cherchez pourquoi un module est visible ou non.">
        <TutorialRoleMatrix currentRole={profile?.role} />
      </CollapsibleSection>
      </PageShell>
    </main>
  );
}
