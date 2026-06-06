import { useMemo, useState } from "react";
import type { AnnualPlanning } from "../../types/planning";
import type { DirigeantPlanningSummary } from "../../types/dirigeants";
import { getDirigeantPlanningSummaries } from "../../lib/planning/planningReadModels";
import { computePlanningQualityIndicators } from "../../lib/planning/planningQuality";
import { PlanningComparisonPanel } from "./PlanningComparisonPanel";
import { PlanningStatusBadge } from "./PlanningStatusBadge";
import { PlanningValidationPanel } from "./PlanningValidationPanel";

function buildFallbackSummary(planning: AnnualPlanning): DirigeantPlanningSummary {
  const quality = computePlanningQualityIndicators(planning);
  return {
    id: planning.id,
    title: planning.title,
    teamId: planning.id,
    teamName: planning.teamName || "Équipe BCVB",
    category: planning.category,
    level: planning.level,
    season: planning.season,
    coachName: planning.createdBy || "Coach BCVB",
    technicalManager: "Responsable technique BCVB",
    status: planning.status,
    validationStatus: planning.status === "publié" ? "published" : "ready_for_validation",
    currentCycle: planning.cycles[0]?.title || "Cycle à définir",
    nextCycle: planning.cycles[1]?.title || "Cycle suivant à définir",
    mainObjectives: planning.globalObjectives.slice(0, 3).map((objective) => objective.label),
    linkedSessionsCount: quality.linkedSessionsCount,
    completedSessionsCount: quality.completedSessionsCount,
    plannedWeeksCount: quality.plannedWeeksCount,
    cyclesCount: quality.cyclesCount,
    coveredObjectives: quality.coveredObjectives,
    uncoveredObjectives: quality.uncoveredObjectives,
    realizationRate: quality.realizationRate,
    qualityScore: quality.score,
    coherence: quality.coherence,
    alerts: quality.warnings,
    comments: [],
    exports: [
      { label: "Résumé commission", path: `/exports/${planning.id}.pdf`, type: "pdf" },
      { label: "Cycles CSV", path: `/exports/${planning.id}.csv`, type: "csv" },
    ],
  };
}

export function PlanningReadOnlyView({
  planning,
  summary,
}: {
  planning: AnnualPlanning;
  summary?: DirigeantPlanningSummary;
}) {
  const [period, setPeriod] = useState("all");
  const [objective, setObjective] = useState("all");
  const resolvedSummary = useMemo(() => {
    return summary
      || getDirigeantPlanningSummaries().find((item) => item.teamName === planning.teamName)
      || buildFallbackSummary(planning);
  }, [planning, summary]);

  const visibleCycles = planning.cycles.filter((cycle) => {
    const matchPeriod = period === "all" || String(cycle.startWeek).startsWith(period);
    const matchObjective = objective === "all" || cycle.objectives.some((item) => item.bcvbLink === objective || item.label === objective);
    return matchPeriod && matchObjective;
  });

  return (
    <section className="planning-readonly-view">
      <header className="planning-card planning-readonly-header">
        <div>
          <p className="bcvb-eyebrow">Vue dirigeant · Lecture seule</p>
          <h2>{resolvedSummary.title}</h2>
          <span>{resolvedSummary.teamName} · {resolvedSummary.category} · {resolvedSummary.level} · {resolvedSummary.season}</span>
        </div>
        <div className="planning-readonly-status">
          <PlanningStatusBadge status={resolvedSummary.status} />
          <strong>{resolvedSummary.qualityScore}/100</strong>
          <small>Score qualité</small>
        </div>
      </header>

      <section className="planning-card planning-readonly-filters">
        <label>
          Saison
          <input value={resolvedSummary.season} readOnly />
        </label>
        <label>
          Catégorie
          <input value={String(resolvedSummary.category)} readOnly />
        </label>
        <label>
          Équipe
          <input value={resolvedSummary.teamName} readOnly />
        </label>
        <label>
          Niveau
          <input value={String(resolvedSummary.level)} readOnly />
        </label>
        <label>
          Coach
          <input value={resolvedSummary.coachName} readOnly />
        </label>
        <label>
          Statut
          <input value={resolvedSummary.status} readOnly />
        </label>
        <label>
          Période
          <select value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option value="all">Toutes périodes</option>
            <option value="1">Début saison</option>
            <option value="2">Milieu saison</option>
            <option value="3">Fin saison</option>
          </select>
        </label>
        <label>
          Objectif BCVB
          <select value={objective} onChange={(event) => setObjective(event.target.value)}>
            <option value="all">Tous objectifs</option>
            {[...new Set(planning.cycles.flatMap((cycle) => cycle.objectives.map((item) => item.bcvbLink || item.label)))].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="planning-dashboard planning-readonly-kpis">
        <article><span>Semaines planifiées</span><strong>{resolvedSummary.plannedWeeksCount}</strong><small>Progression annuelle</small></article>
        <article><span>Cycles</span><strong>{resolvedSummary.cyclesCount}</strong><small>{resolvedSummary.currentCycle}</small></article>
        <article><span>Séances liées</span><strong>{resolvedSummary.linkedSessionsCount}</strong><small>{resolvedSummary.completedSessionsCount} réalisées</small></article>
        <article><span>Taux réalisation</span><strong>{resolvedSummary.realizationRate}%</strong><small>Objectifs / terrain</small></article>
        <article><span>Cohérence BCVB</span><strong>{resolvedSummary.coherence.bcvb}%</strong><small>Identité club</small></article>
      </section>

      <section className="planning-readonly-grid">
        <div className="planning-readonly-main">
          <section className="planning-card dirigeant-readonly-panel">
            <div className="planning-section-title">
              <span>Objectifs de saison</span>
              <h2>Intentions principales</h2>
            </div>
            <div className="planning-objective-list">
              {resolvedSummary.mainObjectives.map((item) => <span key={item}>{item}</span>)}
            </div>
          </section>

          <section className="planning-card dirigeant-readonly-panel">
            <div className="planning-section-title">
              <span>Cycles</span>
              <h2>Lecture par période</h2>
            </div>
            <div className="planning-readonly-cycles">
              {visibleCycles.map((cycle) => (
                <article key={cycle.id} className="planning-readonly-cycle">
                  <header>
                    <div>
                      <strong>{cycle.title}</strong>
                      <span>Semaines {cycle.startWeek} à {cycle.endWeek} · {cycle.durationWeeks} semaines</span>
                    </div>
                    <PlanningStatusBadge status={cycle.status} />
                  </header>
                  <p>{cycle.theme} · Priorité BCVB : {cycle.bcvbPriority}</p>
                  <ul>
                    {cycle.objectives.map((item) => <li key={item.id}>{item.label} — {item.observableCriteria[0]}</li>)}
                  </ul>
                  <div className="planning-readonly-cycle-metrics">
                    <span>{cycle.weeks.length} séances prévues</span>
                    <span>{cycle.weeks.filter((week) => week.linkedSessionIds.length > 0).length} séances liées</span>
                    <span>{cycle.weeks.flatMap((week) => week.validationCriteria).length} critères</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <PlanningComparisonPanel planning={planning} summary={resolvedSummary} />
        </div>

        <aside className="planning-sidebar">
          <PlanningValidationPanel summary={resolvedSummary} />
          <aside className="planning-side-card dirigeant-readonly-panel">
            <div className="planning-section-title">
              <span>Alertes</span>
              <h2>Points à suivre</h2>
            </div>
            {resolvedSummary.alerts.length === 0 ? <p>Aucune alerte bloquante.</p> : (
              <ul>{resolvedSummary.alerts.map((alert) => <li key={alert}>{alert}</li>)}</ul>
            )}
          </aside>
          <aside className="planning-side-card dirigeant-readonly-panel">
            <div className="planning-section-title">
              <span>Commentaires</span>
              <h2>Dirigeants</h2>
            </div>
            {resolvedSummary.comments.length === 0 ? <p>Aucun commentaire dirigeant enregistré.</p> : (
              <ul>{resolvedSummary.comments.map((comment) => <li key={comment.id}>{comment.content}</li>)}</ul>
            )}
          </aside>
          <aside className="planning-side-card dirigeant-readonly-panel">
            <div className="planning-section-title">
              <span>Exports</span>
              <h2>Disponibles</h2>
            </div>
            {resolvedSummary.exports.map((item) => (
              <a key={item.path} href={item.path}>{item.label}</a>
            ))}
          </aside>
        </aside>
      </section>
    </section>
  );
}
