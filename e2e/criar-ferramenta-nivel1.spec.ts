import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("Criar ferramenta - nivel 1 (ADMIN)", () => {
  test("botao Criar Ferramenta visivel para usuario nivel 1", async ({ page }) => {
    // Login as admin (level 1)
    await page.goto("http://localhost:3000/");
    await page.fill('input[type="email"]', "admin@grupoazul.com.br");
    await page.fill('input[type="password"]', "admin12345");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 30000 });

    // Navigate to ferramentas
    await page.goto("http://localhost:3000/dashboard/ferramentas");

    // The "Criar Ferramenta" button should be visible for level 1 users
    await expect(
      page.locator("button", { hasText: "Criar Ferramenta" }),
    ).toBeVisible({ timeout: 15000 });
  });

  test("abre modal ao clicar em Criar Ferramenta", async ({ page }) => {
    // Login as admin (level 1)
    await page.goto("http://localhost:3000/");
    await page.fill('input[type="email"]', "admin@grupoazul.com.br");
    await page.fill('input[type="password"]', "admin12345");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 30000 });

    // Navigate to ferramentas
    await page.goto("http://localhost:3000/dashboard/ferramentas");

    // Click the "Criar Ferramenta" button
    await page
      .locator("button", { hasText: "Criar Ferramenta" })
      .first()
      .click();

    // The modal should appear with "Nova Ferramenta" heading
    await expect(
      page.locator("h2", { hasText: "Nova Ferramenta" }),
    ).toBeVisible({ timeout: 10000 });

    // The form should have name, url, and icon fields
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="url"]')).toBeVisible();
    await expect(page.locator('select[name="icon"]')).toBeVisible();

    // Submit button should be present
    await expect(
      page.locator('button[type="submit"]', { hasText: "Criar Ferramenta" }),
    ).toBeVisible();
  });
});
