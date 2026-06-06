import type { ComponentProps } from "react";
import { RosterMappingPanel } from "./RosterMappingPanel";

export function RosterMappingTable(props: ComponentProps<typeof RosterMappingPanel>) {
  return <RosterMappingPanel {...props} />;
}

