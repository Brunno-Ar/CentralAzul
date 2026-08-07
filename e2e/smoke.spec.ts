import { test, expect } from "@playwright/test";

test("smoke: homepage loads and title contains Central", async ({ page }) => {
  await page.goto("http://localhost:3000");
  const title = await page.title();
  expect(title).toContain("Central");
  await page.screenshot({ path: "e2e-results/smoke-homepage.png" });
});
