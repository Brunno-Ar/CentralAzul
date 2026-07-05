import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("Dashboard - contagem de cards de unidades", () => {
  test("dashboard mostra pelo menos um card de divisao", async ({ page }) => {
    // Login as admin
    await page.goto("http://localhost:3000/");
    await page.fill('input[type="email"]', "admin@grupoazul.com.br");
    await page.fill('input[type="password"]', "admin12345");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 30000 });

    // Wait for the dashboard to render
    await expect(
      page.locator("h1", { hasText: "Ola" }),
    ).toBeVisible({ timeout: 15000 });

    // The "Divisoes do Grupo" section should be visible
    await expect(
      page.locator("text=Divisoes do Grupo"),
    ).toBeVisible({ timeout: 10000 });

    // Count the company cards - they are rendered in a grid with Links
    // Each card is a Link with a motion.div inside
    const companyCards = page.locator(
      ".grid.grid-cols-1 > a, .grid.grid-cols-1 > div > a",
    );
    const cardCount = await companyCards.count();

    // There should be at least 1 card (fallback has 4: Borgo, Grand Reserva, Maple Bear, Azul)
    expect(cardCount).toBeGreaterThan(0);
  });

  test("cards de divisao tem nomes de empresas", async ({ page }) => {
    // Login as admin
    await page.goto("http://localhost:3000/");
    await page.fill('input[type="email"]', "admin@grupoazul.com.br");
    await page.fill('input[type="password"]', "admin12345");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 30000 });

    await expect(
      page.locator("h1", { hasText: "Ola" }),
    ).toBeVisible({ timeout: 15000 });

    // The dashboard should contain company names
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();

    // At least one of these company names should be present
    const hasBorgo = bodyText!.includes("Borgo");
    const hasMaple = bodyText!.includes("Maple");
    const hasAzul = bodyText!.includes("Azul");
    const hasGrand = bodyText!.includes("Grand Reserva");
    expect(hasBorgo || hasMaple || hasAzul || hasGrand).toBeTruthy();
  });
});
