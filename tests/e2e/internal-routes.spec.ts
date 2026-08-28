import { expect, test } from "@playwright/test";

async function expectNotFound(page: import("@playwright/test").Page) {
  const heading = page.getByRole("heading", { name: "Page introuvable" });
  await expect(heading).toBeVisible();
  await expect(heading).toBeFocused();
  await expect(page.getByText("Cette page n’existe pas ou n’est plus disponible.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Retour à l’accueil" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ouvrir le menu", exact: true })).toBeVisible();
  await expect(page).toHaveTitle("Page introuvable · BCVB Référentiel");
}

test("le bouton secondaire ouvre le menu mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/page-inconnue-menu");
  await page.getByRole("button", { name: "Ouvrir le menu", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Navigation mobile BCVB" })).toBeVisible();
});

test("une route publique inconnue affiche la page 404", async ({ page }) => {
  await page.goto("/page-publique-inconnue");
  await expectNotFound(page);
});

test("une route inconnue dans un espace authentifié affiche la page 404", async ({ page }) => {
  await page.goto("/admin/page-inconnue");
  await expectNotFound(page);
});

test("un rafraîchissement direct conserve la page 404", async ({ page }) => {
  await page.goto("/page-inconnue-a-rafraichir");
  await page.reload();
  await expectNotFound(page);
});

for (const path of ["/debug-local", "/demo-commission"]) {
  test(`l’accès direct à ${path} est refusé lorsque les routes internes sont désactivées`, async ({ page }) => {
    await page.goto(path);

    await expectNotFound(page);
  });
}

for (const width of [320, 375, 390, 430]) {
  test(`la page 404 ne déborde pas horizontalement à ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/route-mobile-inconnue");
    await expectNotFound(page);

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  });
}
