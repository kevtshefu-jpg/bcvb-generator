import type { DirigeantQualityAlert } from "../../types/dirigeants";

export function DirigeantAlerts({ alerts }: { alerts: DirigeantQualityAlert[] }) {
  return (
    <section className="dirigeant-section">
      <div className="dirigeant-section__title">
        <span>Alertes qualité</span>
        <h2>Points à traiter</h2>
      </div>

      <div className="dirigeant-alert-list">
        {alerts.length === 0 ? (
          <article className="dirigeant-alert dirigeant-alert--empty">
            <strong>Aucune alerte bloquante</strong>
            <p>Les plans et documents suivis ne présentent pas de blocage majeur.</p>
          </article>
        ) : alerts.map((alert) => (
          <article key={alert.id} className={`dirigeant-alert dirigeant-alert--${alert.severity}`}>
            <span>{alert.severity}</span>
            <strong>{alert.title}</strong>
            <p>{alert.message}</p>
            <small>{alert.recommendedAction}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
