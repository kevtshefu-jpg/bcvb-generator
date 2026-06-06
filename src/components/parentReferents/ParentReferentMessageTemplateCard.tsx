import { useState } from "react";
import type { ParentReferentMessageTemplate } from "../../types/parentReferent";
import { buildMessageCopyPayload } from "../../lib/parentReferents/parentReferentMessages";
import { canCopyValidatedMessage } from "../../lib/permissions/parentReferentPermissions";

export function ParentReferentMessageTemplateCard({
  message,
  userRole,
}: {
  message: ParentReferentMessageTemplate;
  userRole?: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const canCopy = canCopyValidatedMessage(userRole, message);

  async function copyMessage() {
    if (!canCopy) return;
    await navigator.clipboard.writeText(buildMessageCopyPayload(message));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <article className="parent-referent-message-card">
      <div className="parent-referent-message-card__top">
        <span>{message.category}</span>
        <strong>
          {["validated_by_coach", "coach_validated", "club_validated"].includes(message.status)
            ? "Validé coach"
            : message.status === "submitted_to_coach"
              ? "Soumis au coach"
              : "Brouillon"}
        </strong>
      </div>
      <h3>{message.title}</h3>
      <p>{message.body}</p>
      <dl>
        <div><dt>Cible</dt><dd>{message.audience}</dd></div>
        <div><dt>Ton</dt><dd>{message.tone}</dd></div>
        <div><dt>Auteur</dt><dd>{message.createdBy}</dd></div>
        <div><dt>Validation</dt><dd>{message.validatedByCoach || "À valider"}</dd></div>
        <div><dt>Dernière utilisation</dt><dd>{new Date(message.updatedAt).toLocaleDateString("fr-FR")}</dd></div>
      </dl>
      <button type="button" disabled={!canCopy} onClick={copyMessage}>
        {copied ? "Copié" : canCopy ? "Copier" : "Validation requise"}
      </button>
    </article>
  );
}
