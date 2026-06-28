import type { ReactNode } from "react";

type Props = {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function SectionCard({ title, eyebrow, description, actions, children }: Props) {
  return (
    <section className="section-card bcvb-section-card">
      <header className="bcvb-section-card__header">
        <div>
          {eyebrow ? <p className="bcvb-section-card__eyebrow">{eyebrow}</p> : null}
          <h2 className="section-card__title">{title}</h2>
          {description ? <p className="bcvb-section-card__description">{description}</p> : null}
        </div>
        {actions ? <div className="bcvb-section-card__actions">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}
