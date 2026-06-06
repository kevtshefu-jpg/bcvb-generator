import type { PlayerEvaluation } from "../../types/evaluations";

export function EvaluationHistoryPanel({ evaluations }: { evaluations: PlayerEvaluation[] }) {
  return (
    <aside className="evaluation-card evaluation-history-panel">
      <div className="evaluations-section-title">
        <span>Historique</span>
        <h2>Progression annuelle</h2>
      </div>
      <div className="evaluation-history-list">
        {evaluations.map((evaluation) => (
          <article key={evaluation.id}>
            <strong>{evaluation.period}</strong>
            <span>{new Date(evaluation.updatedAt).toLocaleDateString("fr-FR")}</span>
            <p>{evaluation.coachComment || "Commentaire à compléter"}</p>
          </article>
        ))}
        {evaluations.length === 0 && <p>Aucune évaluation enregistrée pour ce joueur.</p>}
      </div>
    </aside>
  );
}

