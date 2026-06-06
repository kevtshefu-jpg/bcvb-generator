import {
  parentReferentDocuments,
  parentReferentEvents,
  parentReferentMessageTemplates,
  parentReferentTeamInfos,
} from "../../lib/parentReferents/parentReferentMockData";
import { getValidatedParentMessages } from "../../lib/parentReferents/parentReferentMessages";
import { ParentReferentAccessNotice } from "./ParentReferentAccessNotice";
import { ParentReferentEventCard } from "./ParentReferentEventCard";
import { ParentReferentDocumentsPanel } from "./ParentReferentDocumentsPanel";
import { ParentReferentMessageTemplateCard } from "./ParentReferentMessageTemplateCard";
import "../../styles/parentReferents.css";

export function ParentReferentPlanningView({ userRole }: { userRole?: string | null }) {
  const teamInfo = parentReferentTeamInfos[0];
  const validatedMessages = getValidatedParentMessages(parentReferentMessageTemplates);

  return (
    <section className="parent-referent-planning-view">
      <section className="parent-referent-section">
        <div className="parent-referent-section__title">
          <span>Vue parents référents</span>
          <h2>Planification simplifiée</h2>
        </div>
        <p className="parent-referent-muted">
          Cette vue affiche uniquement les échéances publiques, événements, besoins logistiques, documents publiés et messages validés.
        </p>
        <div className="parent-referent-simple-calendar">
          {parentReferentEvents.filter((event) => event.teamId === teamInfo.teamId).map((event) => (
            <article key={event.id}>
              <strong>{new Date(event.date).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" })}</strong>
              <span>{event.title}</span>
              <small>RDV {event.meetingTime || "à confirmer"} · {event.location || "Lieu à confirmer"}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="parent-referent-planning-grid">
        <div>
          <ParentReferentEventCard event={teamInfo.nextEvent} />
          <ParentReferentDocumentsPanel documents={parentReferentDocuments} teamId={teamInfo.teamId} userRole={userRole} />
        </div>
        <aside>
          <section className="parent-referent-section">
            <div className="parent-referent-section__title">
              <span>Messages validés</span>
              <h2>Prêts à copier</h2>
            </div>
            <div className="parent-referent-message-grid">
              {validatedMessages.slice(0, 3).map((message) => (
                <ParentReferentMessageTemplateCard key={message.id} message={message} userRole={userRole} />
              ))}
            </div>
          </section>
          <ParentReferentAccessNotice userRole={userRole} />
        </aside>
      </section>
    </section>
  );
}
