import type { BCVBSession } from "../types/session";

interface Props {
  session: BCVBSession;
}

export function JsonPanel({ session }: Props) {
  return (
    <div className="json-panel">
      <h3>JSON de la séance</h3>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </div>
  );
}
