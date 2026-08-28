export const INTERNAL_ROUTE_PATHS = ["debug-local", "demo-commission"] as const;

export type InternalRoutesEnvironment = {
  isDev: boolean;
  enabledFlag?: string;
};

export function areInternalRoutesEnabled({ isDev, enabledFlag }: InternalRoutesEnvironment) {
  return isDev && enabledFlag === "true";
}

export function getInternalRoutePaths(environment: InternalRoutesEnvironment) {
  return areInternalRoutesEnabled(environment) ? [...INTERNAL_ROUTE_PATHS] : [];
}
