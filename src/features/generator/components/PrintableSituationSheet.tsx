import type { GeneratorState } from "../../../types/generator";
import { createDiagramSnapshotFromGeneratorState } from "../utils/diagramSnapshot";

type Props = {
  state: GeneratorState;
};

export function renderPrintableSituationSheet({ state }: Props) {
  const snapshot = createDiagramSnapshotFromGeneratorState(state);

  const intentions = state.meta.intentions.length
    ? state.meta.intentions.map((item) => `<span class="chip">${item}</span>`).join("")
    : `<span>Aucune intention sélectionnée</span>`;

  const coachingPoints = state.meta.coachingPoints.length
    ? state.meta.coachingPoints.map((item) => `<span class="chip">${item}</span>`).join("")
    : `<span>Aucun point de coaching sélectionné</span>`;

  return `
    <div class="sheet">
      <div class="header">
        <div class="title">${state.meta.title || "Situation sans titre"}</div>
        <div class="subtitle">
          BCVB · Fiche coach · ${state.meta.categoryId} · ${state.meta.themeId} · ${state.meta.step}
        </div>
      </div>

      <div class="grid">
        <div class="card">
          <div class="card-title">Résumé</div>
          <div class="meta-row"><span>Catégorie</span><strong>${state.meta.categoryId}</strong></div>
          <div class="meta-row"><span>Thème</span><strong>${state.meta.themeId}</strong></div>
          <div class="meta-row"><span>Étape</span><strong>${state.meta.step}</strong></div>
          <div class="meta-row"><span>Durée</span><strong>${state.meta.duration} min</strong></div>
          <div class="meta-row"><span>Joueurs</span><strong>${state.meta.players}</strong></div>
          <div class="meta-row"><span>Paniers</span><strong>${state.meta.baskets}</strong></div>
        </div>

        <div class="card">
          <div class="card-title">Matériel</div>
          <div>${state.meta.material.join(", ") || "Non renseigné"}</div>
        </div>
      </div>

      <div class="card" style="margin-bottom: 16px;">
        <div class="card-title">Objectif principal</div>
        <div>${state.meta.objective || "Non renseigné"}</div>
      </div>

      <div class="grid">
        <div class="card">
          <div class="card-title">Organisation</div>
          <div>${state.meta.setup || "Non renseigné"}</div>
        </div>

        <div class="card">
          <div class="card-title">Consignes</div>
          <div>${state.meta.instructions || "Non renseigné"}</div>
        </div>
      </div>

      <div class="grid">
        <div class="card">
          <div class="card-title">Critères de réussite</div>
          <div>${(state.meta.successCriteria || "Non renseigné").replace(/\n/g, "<br/>")}</div>
        </div>

        <div class="card">
          <div class="card-title">Variables</div>
          <div>${(state.meta.variables || "Non renseigné").replace(/\n/g, "<br/>")}</div>
        </div>
      </div>

      <div class="grid">
        <div class="card">
          <div class="card-title">Intentions de jeu</div>
          <div class="chips">${intentions}</div>
        </div>

        <div class="card">
          <div class="card-title">Points de coaching</div>
          <div class="chips">${coachingPoints}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Schéma terrain</div>
        <div>${snapshot.svgMarkup}</div>
      </div>
    </div>
  `;
}
