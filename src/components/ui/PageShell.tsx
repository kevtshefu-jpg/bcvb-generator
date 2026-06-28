import type { ReactNode } from "react";

export function PageShell({
  children,
  compact = false,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <main className={compact ? "bcvb-page-shell bcvb-page-shell--compact" : "bcvb-page-shell"}>
      {children}
    </main>
  );
}

export function ActionCard({
  title,
  description,
  to,
  action,
  tone = "neutral",
}: {
  title: string;
  description?: string;
  to?: string;
  action?: ReactNode;
  tone?: "neutral" | "primary" | "danger";
}) {
  const content = (
    <>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action ? <span>{action}</span> : null}
    </>
  );

  if (to) {
    return (
      <a className={`bcvb-action-card bcvb-action-card--${tone}`} href={to}>
        {content}
      </a>
    );
  }

  return <article className={`bcvb-action-card bcvb-action-card--${tone}`}>{content}</article>;
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <article className="bcvb-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <p>{hint}</p> : null}
    </article>
  );
}

export function AdminOnlyPanel({
  title = "Détails techniques",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <details className="bcvb-admin-only-panel">
      <summary>{title}</summary>
      <div>{children}</div>
    </details>
  );
}

export function CollapsibleSection({
  title,
  description,
  children,
  defaultOpen = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="bcvb-collapsible-section" open={defaultOpen}>
      <summary>
        <span>{title}</span>
        {description ? <small>{description}</small> : null}
      </summary>
      <div className="bcvb-collapsible-section__body">{children}</div>
    </details>
  );
}
