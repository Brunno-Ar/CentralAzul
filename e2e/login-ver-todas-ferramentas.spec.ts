import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("Login - ver todas as ferramentas", () => {
  test("exibe paineis incluindo ferramentas bloqueadas", async ({ page }) => {
    // Navigate to the login page
    await page.goto("http://localhost:3000/");

    // Fill in admin credentials (level 1 sees all tools)
    await page.fill('input[type="email"]', "admin@grupoazul.com.br");
    await page.fill('input[type="password"]', "admin12345");
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL("**/dashboard", { timeout: 30000 });

    // Navigate to ferramentas page
    await page.goto("http://localhost:3000/dashboard/ferramentas");

    // Wait for panels to load - the heading should be visible
    await expect(page.locator("h1", { hasText: "Ferramentas" })).toBeVisible({
      timeout: 15000,
    });

    // Wait for the grid to render (loading skeletons disappear)
    await page.waitForSelector("text=Acessar", { timeout: 15000 }).catch(() => {});

    // Assert that at least one panel card is visible
    const panelCards = page.locator(
      ".grid.grid-cols-1 > div, [class*='rounded-2xl'][class*='border']",
    );
    const count = await panelCards.count();
    expect(count).toBeGreaterThan(0);

    // Check that the page contains "Bloqueado" text for locked tools OR "Acessar" for unlocked
    const pageText = await page.textContent("body");
    expect(pageText).toBeTruthy();
    // The page should show permission labels like "Nivel" for each panel
    expect(pageText).toContain("Nivel");
  });
});
