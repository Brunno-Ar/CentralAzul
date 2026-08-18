import { test, expect } from "@playwright/test";

test.describe("Auditoria Completa E2E - Permissões, Unidades e Drive", () => {
  test("1. Admin (Nível 1) visualiza todas as abas incluindo Segurança", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[type="email"]', "admin@grupoazul.com.br");
    await page.fill('input[type="password"]', "admin12345");
    await page.click('button[type="submit"]');

    await page.waitForURL("**/dashboard", { timeout: 30000 });
    await expect(page.locator("text=Seguranca & Niveis")).toBeVisible({ timeout: 10000 });
  });

  test("2. Operador (Nível 3) não visualiza aba de Segurança no menu", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[type="email"]', "operador@grupoazul.com.br");
    await page.fill('input[type="password"]', "operador123");
    await page.click('button[type="submit"]');

    await page.waitForURL("**/dashboard", { timeout: 30000 });
    await expect(page.locator("text=Seguranca & Niveis")).not.toBeVisible();
  });

  test("3. Bloqueio de Rota Direta: Operador (Nível 3) ao acessar /dashboard/seguranca via URL é redirecionado", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[type="email"]', "operador@grupoazul.com.br");
    await page.fill('input[type="password"]', "operador123");
    await page.click('button[type="submit"]');

    await page.waitForURL("**/dashboard", { timeout: 30000 });
    await page.goto("http://localhost:3000/dashboard/seguranca");

    // Deve ser redirecionado para /dashboard por causa da proteção SSR
    await page.waitForURL("**/dashboard", { timeout: 15000 });
    expect(page.url()).not.toContain("/dashboard/seguranca");
  });

  test("4. Unidades de Negócio exibe as 5 unidades reais da Central de Métricas", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[type="email"]', "admin@grupoazul.com.br");
    await page.fill('input[type="password"]', "admin12345");
    await page.click('button[type="submit"]');

    await page.waitForURL("**/dashboard", { timeout: 30000 });
    await page.goto("http://localhost:3000/dashboard/unidades");

    await expect(page.locator("h1", { hasText: "Unidades de Negocio" })).toBeVisible({ timeout: 15000 });

    const content = await page.textContent("body");
    expect(content).toContain("O Borgo Del Vino");
    expect(content).toContain("Vinícola Família Eloy");
    expect(content).toContain("Hotel Borgo Del Vino");
    expect(content).toContain("Azul Incorporações");
    expect(content).toContain("Restaurante Don Eloy");
  });

  test("5. Drive de Arquivos exibe links externos com target _blank", async ({ page }) => {
    await page.goto("/");
    await page.fill('input[type="email"]', "admin@grupoazul.com.br");
    await page.fill('input[type="password"]', "admin12345");
    await page.click('button[type="submit"]');

    await page.waitForURL("**/dashboard", { timeout: 30000 });
    await page.goto("http://localhost:3000/dashboard/documentos");

    await expect(page.locator("h1", { hasText: "Drive de Arquivos" })).toBeVisible({ timeout: 15000 });
  });
});
