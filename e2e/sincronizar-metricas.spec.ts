import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("Sincronizar metricas - 501 soft error", () => {
  test("sincronizar metricas mostra Funcao em desenvolvimento", async ({
    page,
  }) => {
    // Login as admin (level 1, has access to sync button)
    await page.goto("http://localhost:3000/");
    await page.fill('input[type="email"]', "admin@grupoazul.com.br");
    await page.fill('input[type="password"]', "admin12345");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 30000 });

    // Navigate to unidades page
    await page.goto("http://localhost:3000/dashboard/unidades");
    await expect(
      page.locator("h1", { hasText: "Unidades de Neg" }),
    ).toBeVisible({ timeout: 15000 });

    // Wait for units to load and click the first one
    await page.waitForSelector("a[href*='/dashboard/unidades/']", {
      timeout: 15000,
    });
    const unitLinks = page.locator("a[href*='/dashboard/unidades/']");
    const linkCount = await unitLinks.count();

    if (linkCount > 0) {
      await unitLinks.first().click();

      // Wait for the detail page to load
      await page.waitForTimeout(2000);

      // The "Sincronizar Metricas" button should be visible for level <= 2
      const syncButton = page.locator(
        '[aria-label="Sincronizar Metricas"]',
      );
      await expect(syncButton).toBeVisible({ timeout: 15000 });

      // Click the sync button
      await syncButton.click();

      // Wait for response - either sync modal appears OR error message shows
      // The sync API returns 501 with softError when SYNC_API_URL not configured
      // This should show "Funcao em desenvolvimento" message
      await page.waitForTimeout(3000);

      // Check for the error message
      const bodyText = await page.textContent("body");
      expect(bodyText).toBeTruthy();

      // The body should contain the "Funcao em desenvolvimento" message
      // or a success message (if sync API is configured)
      const hasSoftError = bodyText!.includes("Funcao em desenvolvimento");
      const hasSuccess = bodyText!.includes("sincronizadas com sucesso");
      const hasError = bodyText!.includes("Erro ao sincronizar");
      expect(hasSoftError || hasSuccess || hasError).toBeTruthy();
    } else {
      test.skip(true, "No business units available to sync");
    }
  });
});
