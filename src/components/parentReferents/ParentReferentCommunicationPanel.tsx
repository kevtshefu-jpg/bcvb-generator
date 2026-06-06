import { useState } from "react";
import type { ParentReferentMessageTemplate } from "../../types/parentReferent";
import { canProposeParentMessage } from "../../lib/permissions/parentReferentPermissions";
import { buildMessageCopyPayload } from "../../lib/parentReferents/parentReferentMessages";
import { ParentReferentMessageTemplateCard } from "./ParentReferentMessageTemplateCard";

export function ParentReferentCommunicationPanel({
  messages,
  teamId,
  userRole,
}: {
  messages: ParentReferentMessageTemplate[];
  teamId: string;
  userRole?: string | null;
}) {
  const [proposal, setProposal] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState(messages[0]?.id || "");
  const selectedMessage = messages.find((message) => message.id === selectedMessageId) || messages[0];
  const [generatedText, setGeneratedText] = useState(selectedMessage ? buildMessageCopyPayload(selectedMessage) : "");
  const [history, setHistory] = useState<Array<{ id: string; title: string; status: string; date: string }>>([
    { id: "history-1", title: "Rappel match copié", status: "copied", date: "2026-06-03" },
    { id: "history-2", title: "Appel voitures soumis", status: "submitted_to_coach", date: "2026-06-04" },
  ]);
  const canPropose = canProposeParentMessage(userRole, teamId);

  function generateMessage(messageId: string) {
    const next = messages.find((message) => message.id === messageId);
    setSelectedMessageId(messageId);
    setGeneratedText(next ? buildMessageCopyPayload(next) : "");
  }

  function submitToCoach() {
    if (!canPropose || !generatedText.trim()) return;
    setHistory((current) => [{
      id: `history-${Date.now()}`,
      title: selectedMessage?.title || "Message proposé",
      status: "submitted_to_coach",
      date: new Date().toISOString().slice(0, 10),
    }, ...current]);
    setProposal("");
  }

  return (
    <section className="parent-referent-section">
      <div className="parent-referent-section__title">
        <span>Communication</span>
        <h2>Messages types validés</h2>
      </div>

      <div className="parent-referent-message-box">
        <label>
          Choisir un modèle
          <select value={selectedMessageId} onChange={(event) => generateMessage(event.target.value)}>
            {messages.map((message) => <option key={message.id} value={message.id}>{message.title}</option>)}
          </select>
        </label>
        <label>
          Texte logistique préparé
          <textarea value={generatedText} onChange={(event) => setGeneratedText(event.target.value)} />
        </label>
        <div className="parent-referent-action-row">
          <button type="button" disabled={!canPropose || !generatedText.trim()} onClick={submitToCoach}>Proposer au coach</button>
          <button type="button" disabled={!selectedMessage || !["validated_by_coach", "coach_validated", "club_validated"].includes(selectedMessage.status)} onClick={() => navigator.clipboard.writeText(generatedText)}>Copier si validé</button>
        </div>
      </div>

      <div className="parent-referent-message-grid">
        {messages.map((message) => (
          <ParentReferentMessageTemplateCard key={message.id} message={message} userRole={userRole} />
        ))}
      </div>

      <div className="parent-referent-proposal-box">
        <h3>Proposer un message</h3>
        <p>Le coach ou l’admin doit valider avant diffusion officielle.</p>
        <textarea
          disabled={!canPropose}
          value={proposal}
          onChange={(event) => setProposal(event.target.value)}
          placeholder="Proposer un message court à faire valider"
        />
        <button type="button" disabled={!canPropose || !proposal.trim()} onClick={submitToCoach}>Envoyer en validation</button>
      </div>

      <div className="parent-referent-history">
        <h3>Historique des messages</h3>
        {history.map((item) => (
          <article key={item.id}>
            <strong>{item.title}</strong>
            <span>{item.status === "submitted_to_coach" ? "Soumis au coach" : "Copié"} · {new Date(item.date).toLocaleDateString("fr-FR")}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
