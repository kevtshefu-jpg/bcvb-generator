import { Children, type ReactNode } from "react";

export type KeyValueItem = {
  label: string;
  value: ReactNode;
  full?: boolean;
};

export function DataLabel({ children }: { children: ReactNode }) {
  return <span className="responsive-data-label">{children}</span>;
}

export function KeyValueGrid({ items }: { items: KeyValueItem[] }) {
  return (
    <dl className="responsive-data-kv-grid">
      {items.map((item) => (
        <div className={item.full ? "is-full" : undefined} key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function MobileDetailCard({
  eyebrow,
  title,
  subtitle,
  badge,
  items,
  actions,
  tone,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  items: KeyValueItem[];
  actions?: ReactNode;
  tone?: string;
}) {
  return (
    <article className={["responsive-data-card", tone].filter(Boolean).join(" ")}>
      <header className="responsive-data-card__header">
        <div>
          {eyebrow && <DataLabel>{eyebrow}</DataLabel>}
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {badge && <div className="responsive-data-card__badge">{badge}</div>}
      </header>
      <KeyValueGrid items={items} />
      {actions && <div className="responsive-data-card__actions">{actions}</div>}
    </article>
  );
}

export function ResponsiveDataList({
  children,
  empty,
}: {
  children: ReactNode;
  empty?: ReactNode;
}) {
  return <div className="responsive-data-list">{Children.count(children) > 0 ? children : empty}</div>;
}
