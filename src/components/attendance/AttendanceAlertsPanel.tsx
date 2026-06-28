import type { AttendanceAlert } from "../../types/attendance";

export function AttendanceAlertsPanel({ alerts }: { alerts: AttendanceAlert[] }) {
  return (
    <aside className="attendance-card attendance-alerts-panel">
      <div className="attendance-section-title">
        <span>Alertes</span>
        <h2>Assiduité</h2>
      </div>
      <div className="attendance-alert-list">
        {alerts.map((alert) => (
          <article className={`attendance-alert attendance-alert--${alert.level}`} key={alert.id}>
            <span className="attendance-alert__level">{alert.level}</span>
            <strong>{alert.message}</strong>
            <p>{alert.recommendedAction}</p>
          </article>
        ))}
        {alerts.length === 0 && <p>Aucune alerte critique pour cette séance.</p>}
      </div>
    </aside>
  );
}
