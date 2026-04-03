import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
};

export function SectionCard({ title, children }: Props) {
  return (
    <section className="section-card">
      <div className="section-card__title">{title}</div>
      {children}
    </section>
  );
}
