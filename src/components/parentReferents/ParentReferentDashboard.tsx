import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../features/auth/context/AuthContext";
import {
  parentReferentAvailabilities,
  parentReferentDocuments,
  parentReferentMessageTemplates,
  parentReferentTeamInfos,
} from "../../lib/parentReferents/parentReferentMockData";
import { computeParentReferentKpis } from "../../lib/parentReferents/parentReferentLogistics";
import { getValidatedParentMessages } from "../../lib/parentReferents/parentReferentMessages";
import {
  canManageLogisticsAvailability,
  canViewParentReferentSpace,
} from "../../lib/permissions/parentReferentPermissions";
import { ParentReferentAccessNotice } from "./ParentReferentAccessNotice";
import { ParentReferentAvailabilityPanel } from "./ParentReferentAvailabilityPanel";
import { ParentReferentCommunicationPanel } from "./ParentReferentCommunicationPanel";
import { ParentReferentDocumentsPanel } from "./ParentReferentDocumentsPanel";
import { ParentReferentEventCard } from "./ParentReferentEventCard";
import { ParentReferentTeamInfoCard } from "./ParentReferentTeamInfoCard";
import "../../styles/parentReferents.css";

export function ParentReferentDashboard() {
  const { profile } = useAuth();
  const userRole = profile?.role;
  const teamInfo = parentReferentTeamInfos[0];
  const event = teamInfo.nextEvent;
  const eventAvailabilities = parentReferentAvailabilities.filter((item) => item.eventId === event?.id);
  const validatedMessages = useMemo(() => getValidatedParentMessages(parentReferentMessageTemplates), []);
  const kpis = computeParentReferentKpis(event, eventAvailabilities, parentReferentDocuments.length, validatedMessages.length);
  const canView = canViewParentReferentSpace(userRole);
  const canManage = canManageLogisticsAvailability(userRole, teamInfo.teamId);

  if (!canView) {
    return (
      <main className="parent-referent-page">
        <section className="parent-referent-hero">
          <p className="bcvb-eyebrow">Espace parent référent</p>
          <h1>Accès réservé</h1>
          <span>Cette page est réservée aux parents référents autorisés et au staff encadrant.</span>
        </section>
      </main>
    );
  }

  return (
    <main className="parent-referent-page">
      <section className="parent-referent-hero">
        <div>
          <p className="bcvb-eyebrow">Espace parents référents</p>
          <h1>Espace parents référents</h1>
          <span>Un espace simple pour aider l’équipe sur la logistique, les rappels et les documents utiles, sans accès aux données sensibles.</span>
        </div>
        <div className="parent-referent-hero__actions">
          <Link to="/parents-referents/presences">Présences utiles</Link>
          <Link to="/parents-referents/planifications">Vue planning</Link>
          <Link to="/documents-utiles">Documents utiles</Link>
        </div>
      </section>

      <section className="parent-referent-kpi-grid">
        <article><span>Prochain match</span><strong>{kpis.nextMatch}</strong><small>{event?.opponent || "À confirmer"}</small></article>
        <article><span>Joueurs à confirmer</span><strong>{kpis.playersToConfirm}</strong><small>Réponses manquantes</small></article>
        <article><span>Besoins transport</span><strong>{kpis.carsAvailable}</strong><small>{kpis.seatsAvailable} places proposées</small></article>
        <article><span>Aide table</span><strong>{event?.tableNeeded ? "Oui" : "Non"}</strong><small>Chrono / marque</small></article>
        <article><span>Besoins logistiques</span><strong>{kpis.logisticsNeeds}</strong><small>{kpis.logisticsNeedsLabel}</small></article>
        <article><span>Messages validés</span><strong>{kpis.validatedMessagesCount}</strong><small>Validés coach</small></article>
        <article><span>Documents utiles</span><strong>{kpis.documentsCount}</strong><small>Publiés famille</small></article>
      </section>

      <section className="parent-referent-layout">
        <div className="parent-referent-main">
          <ParentReferentTeamInfoCard teamInfo={teamInfo} />
          <ParentReferentAvailabilityPanel initialAvailabilities={eventAvailabilities} event={event} canManage={canManage} />
          <ParentReferentDocumentsPanel documents={parentReferentDocuments} teamId={teamInfo.teamId} userRole={userRole} />
          <ParentReferentCommunicationPanel messages={parentReferentMessageTemplates} teamId={teamInfo.teamId} userRole={userRole} />
        </div>

        <aside className="parent-referent-sidebar">
          <ParentReferentEventCard event={event} />
          <ParentReferentAccessNotice userRole={userRole} />
        </aside>
      </section>
    </main>
  );
}

export default ParentReferentDashboard;
