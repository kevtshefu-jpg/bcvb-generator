import type { ComponentProps } from "react";
import { TeamLinkedDocuments } from "./TeamLinkedDocuments";

export function TeamLinkedDocumentsPanel(props: ComponentProps<typeof TeamLinkedDocuments>) {
  return <TeamLinkedDocuments {...props} />;
}

