import type { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="empty-state bcvb-empty-state-premium">
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action ? <div className="bcvb-empty-state-premium__action">{action}</div> : null}
    </div>
  );
}
