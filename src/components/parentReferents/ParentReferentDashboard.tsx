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
      <main className="parent-referent-page bcvb-premium-page">
        <section className="parent-referent-hero bcvb-premium-hero">
          <p className="bcvb-eyebrow bcvb-premium-hero__eyebrow">Espace parent référent</p>
          <h1 className="bcvb-premium-hero__title">Accès réservé</h1>
          <span className="bcvb-premium-hero__text">Cette page est réservée aux parents référents autorisés et au staff encadrant.</span>
        </section>
      </main>
    );
  }

  return (
    <main className="parent-referent-page bcvb-premium-page">
      <section className="parent-referent-hero bcvb-premium-hero">
        <div>
          <p className="bcvb-eyebrow bcvb-premium-hero__eyebrow">Espace parents référents</p>
          <h1 className="bcvb-premium-hero__title">Espace parents référents</h1>
          <span className="bcvb-premium-hero__text">Un espace simple pour aider l’équipe sur la logistique, les rappels et les documents utiles, sans accès aux données sensibles.</span>
        </div>
        <div className="parent-referent-hero__actions bcvb-premium-actions bcvb-action-row-safe">
          <Link className="bcvb-premium-button bcvb-premium-button--primary" to="/parents-referents/presences">Présences utiles</Link>
          <Link className="bcvb-premium-button bcvb-premium-button--ghost" to="/parents-referents/planifications">Vue planning</Link>
          <Link className="bcvb-premium-button bcvb-premium-button--ghost" to="/documents-utiles">Documents utiles</Link>
        </div>
      </section>

      <section className="bcvb-premium-card bcvb-premium-card--priority premium-pilotage-priority bcvb-card-safe">
        <div>
          <p className="bcvb-premium-card__eyebrow bcvb-tag-safe">Priorité logistique</p>
          <h2 className="bcvb-premium-card__title bcvb-text-clamp-2">{event?.title || "Prochain événement à confirmer"}</h2>
          <p className="bcvb-premium-card__text bcvb-text-clamp-3">
            Vérifier les réponses utiles, le transport et les besoins d’aide avant le prochain rendez-vous équipe.
          </p>
          <ul className="bcvb-premium-card__meta bcvb-scroll-row">
            <li className="bcvb-badge-safe">{kpis.playersToConfirm} réponses manquantes</li>
            <li className="bcvb-badge-safe">{kpis.seatsAvailable} places proposées</li>
            <li className="bcvb-badge-safe">{kpis.logisticsNeedsLabel}</li>
          </ul>
        </div>
        <div className="bcvb-premium-actions bcvb-action-row-safe">
          <Link className="bcvb-premium-button bcvb-premium-button--primary" to="/parents-referents/presences">Faire le point</Link>
          <span className="bcvb-premium-status bcvb-premium-status--warning bcvb-status-safe">À vérifier avant diffusion</span>
        </div>
      </section>

      <section className="parent-referent-kpi-grid bcvb-premium-grid bcvb-premium-grid--4 bcvb-grid-safe">
        <article className="bcvb-premium-kpi bcvb-card-safe"><span className="bcvb-premium-kpi__label bcvb-text-clamp-2">Prochain match</span><strong className="bcvb-premium-kpi__value">{kpis.nextMatch}</strong><small>{event?.opponent || "À confirmer"}</small></article>
        <article className="bcvb-premium-kpi bcvb-card-safe"><span className="bcvb-premium-kpi__label bcvb-text-clamp-2">Joueurs à confirmer</span><strong className="bcvb-premium-kpi__value">{kpis.playersToConfirm}</strong><small>Réponses manquantes</small></article>
        <article className="bcvb-premium-kpi bcvb-card-safe"><span className="bcvb-premium-kpi__label bcvb-text-clamp-2">Besoins transport</span><strong className="bcvb-premium-kpi__value">{kpis.carsAvailable}</strong><small>{kpis.seatsAvailable} places proposées</small></article>
        <article className="bcvb-premium-kpi bcvb-card-safe"><span className="bcvb-premium-kpi__label bcvb-text-clamp-2">Aide table</span><strong className="bcvb-premium-kpi__value">{event?.tableNeeded ? "Oui" : "Non"}</strong><small>Chrono / marque</small></article>
        <article className="bcvb-premium-kpi bcvb-card-safe"><span className="bcvb-premium-kpi__label bcvb-text-clamp-2">Besoins logistiques</span><strong className="bcvb-premium-kpi__value">{kpis.logisticsNeeds}</strong><small>{kpis.logisticsNeedsLabel}</small></article>
        <article className="bcvb-premium-kpi bcvb-card-safe"><span className="bcvb-premium-kpi__label bcvb-text-clamp-2">Messages validés</span><strong className="bcvb-premium-kpi__value">{kpis.validatedMessagesCount}</strong><small>Validés coach</small></article>
        <article className="bcvb-premium-kpi bcvb-card-safe"><span className="bcvb-premium-kpi__label bcvb-text-clamp-2">Documents utiles</span><strong className="bcvb-premium-kpi__value">{kpis.documentsCount}</strong><small>Publiés famille</small></article>
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
