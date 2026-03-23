import { expect, test } from "@playwright/test";
import { signIn, signOut } from "./helpers";

test("user can place a stake and admin can settle the seeded market", async ({ page }) => {
  await signIn(page, "captain@stakeipl.app", "userpass123");

  await page.goto("/markets/seed-market-mi-csk-winner");
  await page.getByLabel(/Mumbai Indians|Chennai Super Kings/).first().click();
  await page.getByLabel("Stake amount").fill("100");
  await page.getByRole("button", { name: "Place stake" }).click();

  await expect(page.getByText("Stake placed successfully.")).toBeVisible();
  await expect(page.getByText("You already have a locked position in this market.")).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByText("4,900")).toBeVisible();

  await signOut(page);

  await signIn(page, "admin@stakeipl.app", "adminpass123");
  await page.goto("/admin");
  await page.getByRole("button", { name: "Settle market" }).first().click();

  await expect(page.getByText(/Settled 1 stake\(s\) for/)).toBeVisible();

  await signOut(page);

  await signIn(page, "captain@stakeipl.app", "userpass123");
  await page.goto("/dashboard");
  await expect(page.getByText(/5,082|4,900/)).toBeVisible();
});
