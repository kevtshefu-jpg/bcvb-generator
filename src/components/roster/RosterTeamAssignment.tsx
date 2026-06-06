import type { ComponentProps } from "react";
import { TeamAssignmentPanel } from "./TeamAssignmentPanel";

export function RosterTeamAssignment(props: ComponentProps<typeof TeamAssignmentPanel>) {
  return <TeamAssignmentPanel {...props} />;
}

