import { describe, expect, it } from "vitest";
import { matchRoutes } from "react-router-dom";
import { areInternalRoutesEnabled, getInternalRoutePaths } from "./internalRoutes";

function matchedPath(url: string, isDev: boolean, enabledFlag?: string) {
  const internalRoutes = getInternalRoutePaths({ isDev, enabledFlag }).map((path) => ({ path }));
  const matches = matchRoutes([...internalRoutes, { path: "*" }], url);
  return matches?.[matches.length - 1]?.route.path;
}

describe("internalRoutes", () => {
  it("exclut les routes techniques de la production même si la variable vaut true", () => {
    expect(areInternalRoutesEnabled({ isDev: false, enabledFlag: "true" })).toBe(false);
    expect(getInternalRoutePaths({ isDev: false, enabledFlag: "true" })).toEqual([]);
  });

  it("exclut les routes techniques en développement lorsque la variable vaut false", () => {
    expect(getInternalRoutePaths({ isDev: true, enabledFlag: "false" })).toEqual([]);
  });

  it("autorise les routes uniquement en développement avec une autorisation explicite", () => {
    expect(getInternalRoutePaths({ isDev: true, enabledFlag: "true" })).toEqual([
      "debug-local",
      "demo-commission",
    ]);
  });

  it.each(["/debug-local", "/demo-commission"])(
    "dirige l’accès direct à %s vers la route 404 en production",
    (url) => {
      expect(matchedPath(url, false, "true")).toBe("*");
    }
  );
});
