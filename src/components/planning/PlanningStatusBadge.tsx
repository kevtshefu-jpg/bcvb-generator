import type { PlanningStatus } from "../../types/planning";
import type { ValidationStatus } from "../../types/dirigeants";

const labels: Record<string, string> = {
  brouillon: "Brouillon",
  "en construction": "En construction",
  proposée: "Proposée",
  "à valider": "À valider",
  "validée technique": "Validée technique",
  "en validation dirigeant": "En validation dirigeant",
  validé: "Validé",
  publié: "Publié",
  archivé: "Archivé",
  draft: "Brouillon",
  to_correct: "À corriger",
  ready_for_validation: "Prêt validation",
  in_dirigeant_validation: "En validation dirigeant",
  validated: "Validé",
  published: "Publié",
  archived: "Archivé",
};

export function PlanningStatusBadge({ status }: { status: PlanningStatus | ValidationStatus | string }) {
  return (
    <span className={`dirigeant-status-badge dirigeant-status-badge--${String(status).replace(/\s|_/g, "-")}`}>
      {labels[status] || status}
    </span>
  );
}
