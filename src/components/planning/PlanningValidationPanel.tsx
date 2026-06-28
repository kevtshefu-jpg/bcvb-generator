import { useMemo, useState } from "react";
import type { DirigeantPlanningSummary, ValidationRecord, ValidationStatus } from "../../types/dirigeants";
import { useAuth } from "../../features/auth/context/AuthContext";
import { canCommentPlanning, canRequestCorrection, canValidatePlanning } from "../../lib/dirigeants/dirigeantPermissions";
import { requestCorrection, validateByDirigeant } from "../../lib/dirigeants/validationWorkflow";
import { PlanningStatusBadge } from "./PlanningStatusBadge";
import { EmptyState } from "../ui/ResponsiveDataView";

type ValidationTargetState = {
  id: string;
  status: string;
  validationStatus: ValidationStatus;
  qualityScore: number;
  validationHistory: ValidationRecord[];
};

export function PlanningValidationPanel({ summary }: { summary: DirigeantPlanningSummary }) {
  const { profile } = useAuth();
  const [comment, setComment] = useState("");
  const [target, setTarget] = useState<ValidationTargetState>({
    id: summary.id,
    status: summary.status,
    validationStatus: summary.validationStatus,
    qualityScore: summary.qualityScore,
    validationHistory: [],
  });

  const permissions = useMemo(() => ({
    canComment: canCommentPlanning(profile, { status: summary.status, validationEnabled: true }),
    canCorrect: canRequestCorrection(profile),
    canValidate: canValidatePlanning(profile, { status: summary.status, validationEnabled: true }),
  }), [profile, summary.status]);

  function handleCorrection() {
    const reason = comment || "Correction demandée par la commission sportive.";
    setTarget(requestCorrection(target, reason, profile?.full_name || "Dirigeant BCVB"));
    setComment("");
  }

  function handleValidation() {
    setTarget(validateByDirigeant(target, comment || "Validation dirigeant accordée.", profile?.full_name || "Dirigeant BCVB"));
    setComment("");
  }

  return (
    <aside className="planning-side-card dirigeant-validation-card">
      <div className="planning-section-title">
        <span>Validation dirigeant</span>
        <h2>Workflow commission</h2>
      </div>

      <div className="dirigeant-validation-meta">
        <span>Statut actuel</span>
        <PlanningStatusBadge status={target.validationStatus} />
        <strong>{summary.qualityScore}/100</strong>
      </div>

      <label>
        Commentaire dirigeant
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          disabled={!permissions.canComment}
          placeholder="Ajouter un commentaire, un motif de correction ou une réserve de validation"
        />
      </label>

      <div className="dirigeant-validation-actions">
        <button type="button" disabled={!permissions.canCorrect} onClick={handleCorrection}>Demander correction</button>
        <button type="button" disabled={!permissions.canValidate} onClick={handleValidation}>Valider</button>
      </div>

      {!permissions.canValidate && <p className="planning-warning">Validation réservée à l’admin ou au dirigeant habilité.</p>}

      <h3>Historique</h3>
      {target.validationHistory.length === 0 ? (
        <EmptyState
          title="Aucune action enregistrée"
          description="Les validations, réserves et demandes de correction apparaîtront ici dès qu’une décision sera prise."
        />
      ) : (
        <ul>
          {target.validationHistory.map((record) => (
            <li key={record.id}>{record.comment} <small>{new Date(record.createdAt).toLocaleDateString("fr-FR")}</small></li>
          ))}
        </ul>
      )}
    </aside>
  );
}
