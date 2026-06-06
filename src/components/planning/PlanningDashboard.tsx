import type { AnnualPlanning } from "../../types/planning";
import { scorePlanning } from "../../lib/planning/planningScoring";

export function PlanningDashboard({ planning }: { planning: AnnualPlanning }) {
  const score = scorePlanning(planning);
  const weeks = planning.cycles.flatMap((cycle) => cycle.weeks);
  const linkedWeeks = weeks.filter((week) => week.linkedSessionIds.length > 0).length;
  const lockedCycles = planning.cycles.filter((cycle) => cycle.locked || cycle.status === "verrouillé").length;

  return (
    <section className="planning-dashboard" aria-label="Indicateurs planification">
      <article>
        <span>Score qualité</span>
        <strong>{score.score}/100</strong>
        <small>{score.publishable ? "Prêt commission" : "À consolider"}</small>
      </article>
      <article>
        <span>Cycles</span>
        <strong>{planning.cycles.length}</strong>
        <small>{lockedCycles} verrouillé(s)</small>
      </article>
      <article>
        <span>Semaines</span>
        <strong>{weeks.length}</strong>
        <small>{planning.trainingFrequencyPerWeek} entraînement(s) / semaine</small>
      </article>
      <article>
        <span>Séances liées</span>
        <strong>{linkedWeeks}</strong>
        <small>Semaines reliées au terrain</small>
      </article>
      <article>
        <span>Statut</span>
        <strong>{planning.status}</strong>
        <small>{planning.updatedAt ? new Date(planning.updatedAt).toLocaleDateString("fr-FR") : "Non sauvegardé"}</small>
      </article>
    </section>
  );
}
