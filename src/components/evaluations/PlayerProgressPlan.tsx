import type { EvaluationDomain, IndividualObjective } from "../../types/evaluations";
import { evaluationDomainLabels, evaluationDomains } from "../../lib/evaluations/evaluationTemplates";

export function PlayerProgressPlan({
  objective,
  playerId,
  disabled,
  onChange,
}: {
  objective?: IndividualObjective;
  playerId: string;
  disabled?: boolean;
  onChange: (objective: IndividualObjective) => void;
}) {
  const current = objective || {
    id: `objective-${playerId}`,
    playerId,
    title: "Améliorer la pression défensive sur porteur",
    domain: "agressivite_maitrisee" as EvaluationDomain,
    targetDescription: "Être plus actif sur le porteur tout en maîtrisant les fautes.",
    observableCriterion: "Se place entre joueur et panier, conteste sans faute, reste actif après premier effort.",
    quantifiableCriterion: "Minimum 3 stops défensifs ou contestations efficaces par opposition.",
    deadline: "4 semaines",
    linkedSessions: [],
    status: "a_travailler" as const,
  };

  function patch(patchObjective: Partial<IndividualObjective>) {
    onChange({ ...current, ...patchObjective });
  }

  return (
    <section className="evaluation-card evaluation-objective">
      <div className="evaluations-section-title">
        <span>Objectif individuel</span>
        <h2>Plan de progression</h2>
      </div>
      <div className="evaluation-objective-grid">
        <label>
          Titre
          <input disabled={disabled} value={current.title} onChange={(event) => patch({ title: event.target.value })} />
        </label>
        <label>
          Domaine
          <select disabled={disabled} value={current.domain} onChange={(event) => patch({ domain: event.target.value as EvaluationDomain })}>
            {evaluationDomains.map((domain) => <option key={domain} value={domain}>{evaluationDomainLabels[domain]}</option>)}
          </select>
        </label>
        <label>
          Délai
          <input disabled={disabled} value={current.deadline || ""} onChange={(event) => patch({ deadline: event.target.value })} />
        </label>
        <label>
          Statut
          <select disabled={disabled} value={current.status} onChange={(event) => patch({ status: event.target.value as IndividualObjective["status"] })}>
            <option value="a_travailler">À travailler</option>
            <option value="en_cours">En cours</option>
            <option value="valide">Validé</option>
            <option value="abandonne">Archivé</option>
          </select>
        </label>
        <label className="evaluation-objective-wide">
          Description
          <textarea disabled={disabled} value={current.targetDescription} onChange={(event) => patch({ targetDescription: event.target.value })} />
        </label>
        <label className="evaluation-objective-wide">
          Observable
          <textarea disabled={disabled} value={current.observableCriterion} onChange={(event) => patch({ observableCriterion: event.target.value })} />
        </label>
        <label className="evaluation-objective-wide">
          Quantifiable
          <textarea disabled={disabled} value={current.quantifiableCriterion || ""} onChange={(event) => patch({ quantifiableCriterion: event.target.value })} />
        </label>
        <label className="evaluation-objective-wide">
          Séance / planification liée
          <input disabled={disabled} value={current.linkedSessions?.join(", ") || ""} onChange={(event) => patch({ linkedSessions: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} />
        </label>
      </div>
    </section>
  );
}

