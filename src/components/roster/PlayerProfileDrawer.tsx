import type { ComponentProps } from "react";
import { PlayerProfile } from "./PlayerProfile";

export function PlayerProfileDrawer(props: ComponentProps<typeof PlayerProfile>) {
  return <PlayerProfile {...props} />;
}

