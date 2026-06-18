import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import type { AnnualPlanning, PlanningBuilderInput, PlanningStatus } from "../../types/planning";
import { createAnnualPlanning, createPlanningVersion, updatePlanningTimestamp } from "../../lib/planning/planningEngine";
import { CATEGORY_STANDARDS, getCoachAdjustment, getLevelFocus } from "../../lib/planning/planningStandards";
import { usePersistentDraft } from "../../hooks/usePersistentDraft";
import { PlanningCategorySelector } from "./PlanningCategorySelector";
import { PlanningDashboard } from "./PlanningDashboard";
import { PlanningBuilder } from "./PlanningBuilder";
import { PlanningQualityPanel } from "./PlanningQualityPanel";
import { PlanningExportPanel } from "./PlanningExportPanel";
import { PlanningVersionHistory } from "./PlanningVersionHistory";
import { PlanningReadOnlyView } from "./PlanningReadOnlyView";
import { ParentReferentPlanningView } from "../parentReferents/ParentReferentPlanningView";
import { useAuth } from "../../features/auth/context/AuthContext";
import CoachGuidancePanel from "../../features/coach/components/CoachGuidancePanel";
import CoachModeToggle from "../../features/coach/components/CoachModeToggle";
import CoachNoviceHelpCard from "../../features/coach/components/CoachNoviceHelpCard";
import CoachWorkflowStepper from "../../features/coach/components/CoachWorkflowStepper";
import { useCoachToolMode } from "../../features/coach/hooks/useCoachToolMode";
import "../../styles/planning.css";
import "../../features/coach/styles/coach-tools-mode.css";

type PlanningDraft = {
  input: PlanningBuilderInput;
  planning: AnnualPlanning;
};

type PlanningPageProps = {
  readOnly?: boolean;
};

const defaultInput: PlanningBuilderInput = {
  teamName: "Équipe BCVB",
  season: "2026-2027",
  category: "U13",
  level: "Départemental",
  coachProfile: "Confirmé",
  trainingFrequencyPerWeek: 2,
  matchLevel: "Départemental",
  constraints: ["2 entraînements / semaine", "Calendrier match à confirmer"],
  createdBy: "BCVB",
};

function createDefaultDraft(): PlanningDraft {
  return {
    input: defaultInput,
    planning: createAnnualPlanning(defaultInput),
  };
}

export function PlanningPage({ readOnly = false }: PlanningPageProps) {
  const { profile } = useAuth();
  const { pathname } = useLocation();
  const { mode, isNovice, isExpert, toggleMode } = useCoachToolMode();
  const initialDraft = useMemo(() => createDefaultDraft(), []);
  const { draft, setDraft, restored, resetDraft, dirty, markSaved } = usePersistentDraft<PlanningDraft>("bcvb-planning-builder-v2", initialDraft);
  const [versionComment, setVersionComment] = useState("Point d’étape technique");
  const standard = CATEGORY_STANDARDS[draft.input.category];
  const isReadOnly = readOnly || profile?.role === "dirigeant";
  const isParentReferentView = readOnly && (profile?.role === "parent_referent" || pathname.startsWith("/parents-referents"));
  const currentPlanningStep = dirty ? 4 : restored ? 3 : 1;

  function updatePlanning(planning: AnnualPlanning) {
    if (isReadOnly) return;
    setDraft((current) => ({
      ...current,
      planning: updatePlanningTimestamp(planning),
    }));
  }

  function regeneratePlanning() {
    if (isReadOnly) return;
    setDraft((current) => ({
      ...current,
      planning: createAnnualPlanning(current.input),
    }));
  }

  function savePlanning() {
    if (isReadOnly) return;
    window.localStorage.setItem("bcvb-last-planning", JSON.stringify(draft.planning));
    markSaved();
  }

  function saveVersion() {
    if (isReadOnly) return;
    setDraft((current) => {
      const version = createPlanningVersion(current.planning, versionComment || "Version technique", current.input.createdBy || "BCVB");
      return {
        ...current,
        planning: {
          ...current.planning,
          versions: [version, ...current.planning.versions].slice(0, 12),
          updatedAt: new Date().toISOString(),
        },
      };
    });
    setVersionComment("Point d’étape technique");
  }

  function updateStatus(status: PlanningStatus) {
    if (isReadOnly) return;
    updatePlanning({ ...draft.planning, status });
  }

  return (
    <main
      className={[
        "planning-page",
        "planning-builder-page",
        `planning-builder-page--${mode}`,
        isReadOnly ? "is-readonly" : "",
      ].filter(Boolean).join(" ")}
    >
      <section className="planning-hero">
        <div>
          <p>Planifications sportives</p>
          <h1>Construire, adapter et exporter la progression sportive BCVB</h1>
          <span>Plan annuel, cycles de 4 à 6 semaines, semaines modifiables, scoring qualité et exports commission.</span>
        </div>
        <div className="planning-hero-actions">
          {isReadOnly && <strong>Lecture seule</strong>}
          {restored && <strong>Brouillon restauré</strong>}
          {dirty && !isReadOnly && <strong>Modifications non sauvegardées</strong>}
          {!isReadOnly && <button type="button" onClick={savePlanning}>Sauvegarder</button>}
          {!isReadOnly && <button type="button" onClick={resetDraft}>Réinitialiser</button>}
        </div>
      </section>

      {!isReadOnly && (
        <section
          className={[
            "coach-tool-mode-shell",
            isExpert ? "coach-tool-mode-shell--expert" : "",
          ].filter(Boolean).join(" ")}
        >
          <CoachModeToggle mode={mode} onToggle={toggleMode} compact={isExpert} />

          {isNovice && (
            <CoachWorkflowStepper variant="planning" currentStep={currentPlanningStep} />
          )}

          <CoachGuidancePanel mode={mode} tool="planning" />

          {isNovice && (
            <CoachNoviceHelpCard title="Conseil jeune coach" tone="red">
              <p>
                Planifie peu mais clairement. Une bonne planification doit dire quoi
                travailler, pourquoi, quand, et comment réguler après les matchs.
              </p>
            </CoachNoviceHelpCard>
          )}
        </section>
      )}

      {isReadOnly && (
        isParentReferentView
          ? <ParentReferentPlanningView userRole={profile?.role} />
          : <PlanningReadOnlyView planning={draft.planning} />
      )}

      {!isReadOnly && (
        <>
      <PlanningDashboard planning={draft.planning} />

      <section className="planning-layout">
        <div className="planning-main">
          <PlanningCategorySelector
            input={draft.input}
            onChange={(input) => setDraft((current) => ({ ...current, input }))}
            onGenerate={regeneratePlanning}
            readOnly={isReadOnly}
          />

          <section className="planning-card planning-context">
            <div className="planning-section-title">
              <span>Adaptation catégorie</span>
              <h2>{draft.input.category} · {draft.input.level}</h2>
            </div>
            <div className="planning-context-grid">
              <article><strong>Focus âge</strong><p>{standard.ageFocus}</p></article>
              <article><strong>Niveau</strong><p>{getLevelFocus(draft.input.level)}</p></article>
              <article><strong>Profil coach</strong><p>{getCoachAdjustment(draft.input.coachProfile)}</p></article>
              <article><strong>Vigilance</strong><p>{standard.warning}</p></article>
            </div>
          </section>

          <PlanningBuilder planning={draft.planning} onChange={updatePlanning} readOnly={isReadOnly} />
        </div>

        <aside className="planning-sidebar">
          <PlanningQualityPanel planning={draft.planning} />
          <PlanningExportPanel planning={draft.planning} onStatusChange={updateStatus} onSaveVersion={saveVersion} readOnly={isReadOnly} />
          <aside className="planning-side-card">
            <div className="planning-section-title">
              <span>Commentaire version</span>
              <h2>Suivi technique</h2>
            </div>
            <textarea disabled={isReadOnly} value={versionComment} onChange={(event) => setVersionComment(event.target.value)} />
          </aside>
          <PlanningVersionHistory versions={draft.planning.versions} />
        </aside>
      </section>
        </>
      )}
    </main>
  );
}

export default PlanningPage;
