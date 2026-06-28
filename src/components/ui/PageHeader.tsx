import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: ReactNode;
  meta?: ReactNode;
};

export function PageHeader({ title, subtitle, eyebrow, action, meta }: Props) {
  return (
    <header className="page-header bcvb-page-header">
      <div>
        {eyebrow ? <p className="bcvb-page-header__eyebrow">{eyebrow}</p> : null}
        <h1 className="page-header__title">{title}</h1>
        {subtitle ? <p className="page-header__subtitle">{subtitle}</p> : null}
        {meta ? <div className="bcvb-page-header__meta">{meta}</div> : null}
      </div>
      {action ? <div className="bcvb-page-header__action">{action}</div> : null}
    </header>
  );
}
