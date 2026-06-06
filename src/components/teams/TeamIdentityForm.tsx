import type { ComponentProps } from "react";
import { TeamIdentityCard } from "./TeamIdentityCard";

export function TeamIdentityForm(props: ComponentProps<typeof TeamIdentityCard>) {
  return <TeamIdentityCard {...props} />;
}

