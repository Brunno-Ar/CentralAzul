import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("Criar unidade - redireciona para /dashboard", () => {
  test("criar unidade redireciona para dashboard apos criacao", async ({
    page,
  }) => {
    // Login as admin (level 1) to have create permissions
    await page.goto("http://localhost:3000/");
    await page.fill('input[type="email"]', "admin@grupoazul.com.br");
    await page.fill('input[type="password"]', "admin12345");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 30000 });

    // Navigate to unidades page
    await page.goto("http://localhost:3000/dashboard/unidades");

    // Wait for the page to load
    await expect(
      page.locator("h1", { hasText: "Unidades de Neg" }),
    ).toBeVisible({ timeout: 15000 });

    // The "Nova Unidade" button should be visible for admin
    await expect(
      page.locator("button", { hasText: "Nova Unidade" }),
    ).toBeVisible({ timeout: 10000 });

    // Click to open the create modal
    await page.locator("button", { hasText: "Nova Unidade" }).click();

    // The modal should appear
    await expect(
      page.locator("h2", { hasText: "Nova Unidade de Neg" }),
    ).toBeVisible({ timeout: 10000 });

    // Fill in the form with a unique slug
    const uniqueSlug = `test-unit-${Date.now()}`;
    await page.fill('input[name="name"]', "Unidade Teste E2E");
    await page.fill('input[name="slug"]', uniqueSlug);
    await page.selectOption('select[name="company"]', "BORGO");
    await page.fill('textarea[name="description"]', "Descricao teste e2e");

    // Submit the form
    await page
      .locator('button[type="submit"]', { hasText: "Criar Unidade" })
      .click();

    // After creation, should redirect to /dashboard
    await page.waitForURL("**/dashboard", { timeout: 15000 });
    expect(page.url()).toContain("/dashboard");
  });
});
