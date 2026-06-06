import type { TeamLogisticsEvent } from "../../types/parentReferent";

export function ParentReferentEventCard({ event }: { event?: TeamLogisticsEvent }) {
  if (!event) {
    return (
      <article className="parent-referent-event-card">
        <span>Prochain événement</span>
        <h3>À confirmer</h3>
        <p>Aucun événement public transmis pour l’instant.</p>
      </article>
    );
  }

  const needs = [
    event.transportNeeded ? "Voitures" : "",
    event.tableNeeded ? "Table" : "",
    event.snackNeeded ? "Goûter" : "",
    event.jerseyWashNeeded ? "Lavage maillots" : "",
  ].filter(Boolean);

  return (
    <article className="parent-referent-event-card">
      <span>Prochain événement</span>
      <h3>{event.title}</h3>
      <p>{new Date(event.date).toLocaleDateString("fr-FR")} · RDV {event.meetingTime || "à confirmer"} · Match {event.gameTime || "à confirmer"}</p>
      <dl>
        <div><dt>Lieu</dt><dd>{event.location || "À confirmer"}</dd></div>
        <div><dt>Adversaire</dt><dd>{event.opponent || "À confirmer"}</dd></div>
        <div><dt>Besoins</dt><dd>{needs.join(" · ") || "Aucun besoin urgent"}</dd></div>
      </dl>
      {event.note && <strong>{event.note}</strong>}
    </article>
  );
}
