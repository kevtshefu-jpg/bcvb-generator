import type { AttendanceAlert } from "../../types/attendance";
import { EmptyState } from "../ui/ResponsiveDataView";

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
        {alerts.length === 0 && (
          <EmptyState
            title="Aucune alerte critique"
            description="La séance ne présente pas de point bloquant. Continue le suivi régulier des présences."
          />
        )}
      </div>
    </aside>
  );
}
