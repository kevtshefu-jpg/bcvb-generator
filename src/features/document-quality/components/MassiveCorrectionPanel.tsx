import { useMemo, useState } from "react";
import type {
  CorrectionMode,
  CorrectionPlan,
  DocumentFamily,
  MassiveCorrectionResult,
  QualityScore,
} from "../types/quality.types";
import { applyMassiveCorrection } from "../services/massiveCorrectionAdapter";
import { createCorrectionPlan, getCorrectionModeLabel } from "../services/massiveCorrectionPlanner";
import BeforeAfterDiff from "./BeforeAfterDiff";

type MassiveCorrectionPanelProps = {
  contentSource: string;
  family: DocumentFamily;
  score: QualityScore;
  onCorrectionApplied: (result: MassiveCorrectionResult) => void;
};

export default function MassiveCorrectionPanel({
  contentSource,
  family,
  score,
  onCorrectionApplied,
}: MassiveCorrectionPanelProps) {
  const [mode, setMode] = useState<CorrectionMode>("strong_improvement");
  const [targetScore, setTargetScore] = useState(90);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ before: string; correction: MassiveCorrectionResult } | null>(null);
  const plan: CorrectionPlan = useMemo(() => createCorrectionPlan(score, targetScore, mode), [score, targetScore, mode]);

  function selectMode(nextMode: CorrectionMode) {
    setMode(nextMode);
    setTargetScore(nextMode === "micro_correction" ? 80 : nextMode === "strong_improvement" ? 90 : 95);
    setResult(null);
  }

  async function runCorrection() {
    setRunning(true);
    try {
      const sourceBeforeCorrection = contentSource;
      const nextResult = await applyMassiveCorrection({ contentSource, family, correctionPlan: plan });
      setResult({ before: sourceBeforeCorrection, correction: nextResult });
    } finally {
      setRunning(false);
    }
  }

  function validateCorrection() {
    if (!result) return;
    onCorrectionApplied(result.correction);
    setResult(null);
  }

  const previousScore = result?.correction.previousScore?.globalScore ?? score.globalScore;
  const newScore = result?.correction.newScore?.globalScore;
  const gain = typeof newScore === "number" ? Math.max(0, newScore - previousScore) : 0;

  return (
    <section className="massive-correction-panel no-print">
      <header>
        <div>
          <p className="bcvb-eyebrow">Correction massive</p>
          <h2>{getCorrectionModeLabel(mode)}</h2>
          <span>Score actuel {score.globalScore}/100 · objectif {plan.targetScore}/100 · gain estimé +{plan.estimatedGain}</span>
        </div>
        <label>
          <span>Objectif</span>
          <input
            type="number"
            min={70}
            max={100}
            value={targetScore}
            onChange={(event) => setTargetScore(Number(event.target.value))}
          />
        </label>
      </header>

      <div className="correction-mode-switch" aria-label="Niveau de correction">
        {(["micro_correction", "strong_improvement", "publication_rebuild"] as CorrectionMode[]).map((correctionMode) => (
          <button
            type="button"
            key={correctionMode}
            aria-pressed={mode === correctionMode}
            onClick={() => selectMode(correctionMode)}
          >
            {getCorrectionModeLabel(correctionMode)}
          </button>
        ))}
      </div>

      <div className="correction-preview-grid">
        <article>
          <strong>Éléments conservés</strong>
          {plan.preservedItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </article>
        <article>
          <strong>Éléments restructurés</strong>
          {plan.restructuredItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </article>
        <article>
          <strong>Risques</strong>
          {plan.risks.map((item) => (
            <span key={item}>{item}</span>
          ))}
          <em>Niveau : {plan.riskLevel}</em>
        </article>
      </div>

      <div className="correction-actions-list">
        {plan.actions.length === 0 ? (
          <p>Aucune action automatique nécessaire. Relecture humaine recommandée.</p>
        ) : (
          plan.actions.map((action) => (
            <article key={action.id}>
              <strong>{action.type}</strong>
              <p>{action.description}</p>
              <span>+{action.expectedGain} · {action.requiresAi ? "IA recommandée" : "Correction déterministe"}</span>
            </article>
          ))
        )}
      </div>

      <button type="button" onClick={runCorrection} disabled={running || plan.actions.length === 0}>
        {running ? "Correction en cours..." : `Préparer ${getCorrectionModeLabel(mode).toLowerCase()}`}
      </button>

      {result && (
        <>
          <div className="correction-result-summary">
            <article>
              <span>Ancien score</span>
              <strong>{previousScore}/100</strong>
            </article>
            <article>
              <span>Nouveau score</span>
              <strong>{newScore ?? "—"}/100</strong>
            </article>
            <article>
              <span>Gain</span>
              <strong>+{gain}</strong>
            </article>
          </div>
          <p className="correction-summary">{result.correction.summary}</p>
          <div className="correction-log">
            <strong>Journal des modifications</strong>
            {result.correction.changeLog.map((entry) => (
              <span key={entry}>{entry}</span>
            ))}
          </div>
          <BeforeAfterDiff before={result.before} after={result.correction.correctedSource} />
          <div className="correction-validation-actions">
            <button type="button" onClick={validateCorrection}>
              Valider et créer une version
            </button>
            <button type="button" onClick={() => setResult(null)}>
              Restaurer ancienne version
            </button>
          </div>
        </>
      )}
    </section>
  );
}
