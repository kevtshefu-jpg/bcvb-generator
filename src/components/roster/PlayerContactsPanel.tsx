import type { ComponentProps } from "react";
import { FamilyContactsPanel } from "./FamilyContactsPanel";

export function PlayerContactsPanel(props: ComponentProps<typeof FamilyContactsPanel>) {
  return <FamilyContactsPanel {...props} />;
}
