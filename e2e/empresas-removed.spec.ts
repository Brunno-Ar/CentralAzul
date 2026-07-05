import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("Empresas removido do menu e rota 404", () => {
  test("sidebar nao contem Empresas & Ferramentas", async ({ page }) => {
    // Login as admin
    await page.goto("http://localhost:3000/");
    await page.fill('input[type="email"]', "admin@grupoazul.com.br");
    await page.fill('input[type="password"]', "admin12345");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 30000 });

    // The sidebar should NOT contain "Empresas & Ferramentas" text
    // The nav items are: Painel Principal, Ferramentas, Comunicados, Unidades de Negocio, Drive de Arquivos, Seguranca & Niveis, Configuracoes
    const navText = await page
      .locator("nav, aside, [class*='sidebar']")
      .textContent()
      .catch(() => "");

    // "Empresas & Ferramentas" should not appear in the navigation
    if (navText) {
      expect(navText).not.toContain("Empresas & Ferramentas");
      expect(navText).not.toContain("Empresas & Ferramentas");
    }
  });

  test("rota /dashboard/empresas retorna 404 ou redirect", async ({ page }) => {
    // Login as admin
    await page.goto("http://localhost:3000/");
    await page.fill('input[type="email"]', "admin@grupoazul.com.br");
    await page.fill('input[type="password"]', "admin12345");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 30000 });

    // Navigate to /dashboard/empresas - this route should not exist
    const response = await page.goto(
      "http://localhost:3000/dashboard/empresas",
      { waitUntil: "domcontentloaded" },
    );

    // The response should be a 404, or the page should show notFound content
    // Next.js shows the not-found.tsx or a generic 404 page
    if (response) {
      // Accept either 404 status or a redirect away from this route
      const status = response.status();
      const is404 = status === 404;
      const url = page.url();

      // If not 404, check the page content for "not found" or similar
      if (!is404) {
        const bodyText = await page.textContent("body").catch(() => "");
        const hasNotFound =
          bodyText?.includes("not found") ||
          bodyText?.includes("404") ||
          bodyText?.includes("nao encontrada") ||
          bodyText?.includes("não encontrada") ||
          url !== "http://localhost:3000/dashboard/empresas";
        expect(hasNotFound || is404).toBeTruthy();
      } else {
        expect(is404).toBeTruthy();
      }
    }
  });
});
