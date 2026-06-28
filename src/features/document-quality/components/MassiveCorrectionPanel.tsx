import { useMemo, useState } from "react";
import type { CorrectionPlan, DocumentFamily, MassiveCorrectionResult, QualityScore } from "../types/quality.types";
import { applyMassiveCorrection } from "../services/massiveCorrectionAdapter";
import { createCorrectionPlan } from "../services/massiveCorrectionPlanner";
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
  const [targetScore, setTargetScore] = useState(95);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ before: string; correction: MassiveCorrectionResult } | null>(null);
  const plan: CorrectionPlan = useMemo(() => createCorrectionPlan(score, targetScore), [score, targetScore]);

  async function runCorrection() {
    setRunning(true);
    try {
      const sourceBeforeCorrection = contentSource;
      const nextResult = await applyMassiveCorrection({ contentSource, family, correctionPlan: plan });
      setResult({ before: sourceBeforeCorrection, correction: nextResult });
      onCorrectionApplied(nextResult);
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="massive-correction-panel no-print">
      <header>
        <div>
          <p className="bcvb-eyebrow">Correction massive</p>
          <h2>Plan de reconstruction publication club</h2>
          <span>Score actuel {score.globalScore}/100 · gain estimé +{plan.estimatedGain}</span>
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

      <div className="correction-actions-list">
        {plan.actions.length === 0 ? (
          <p>Aucune action automatique nécessaire. Relecture humaine recommandée.</p>
        ) : (
          plan.actions.map((action) => (
            <article key={action.id}>
              <strong>{action.type}</strong>
              <p>{action.description}</p>
              <span>+{action.expectedGain} · {action.requiresAi ? "Assistance documentaire recommandée" : "Correction automatique"}</span>
            </article>
          ))
        )}
      </div>

      <button type="button" onClick={runCorrection} disabled={running || plan.actions.length === 0}>
        {running ? "Correction en cours..." : "Lancer reconstruction publication club"}
      </button>

      {result && (
        <>
          <div className="correction-log">
            <strong>Journal des modifications</strong>
            {result.correction.changeLog.map((entry) => (
              <span key={entry}>{entry}</span>
            ))}
          </div>
          <BeforeAfterDiff before={result.before} after={result.correction.correctedSource} />
        </>
      )}
    </section>
  );
}
