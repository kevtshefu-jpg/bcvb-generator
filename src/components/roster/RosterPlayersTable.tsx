import type { ComponentProps } from "react";
import { RosterPreviewTable } from "./RosterPreviewTable";

export function RosterPlayersTable(props: ComponentProps<typeof RosterPreviewTable>) {
  return <RosterPreviewTable {...props} />;
}

