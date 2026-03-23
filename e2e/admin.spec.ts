import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test("admin can top up a user wallet", async ({ page }) => {
  await signIn(page, "admin@stakeipl.app", "adminpass123");
  await page.goto("/admin");

  await page.getByLabel("User").selectOption({ label: "Demo Player" });
  await page.getByLabel("Amount").fill("75");
  await page.getByLabel("Reason").fill("E2E top up");
  await page.getByRole("button", { name: "Apply top-up" }).click();

  await expect(page.getByText("Added 75 coins to Demo Player.")).toBeVisible();
  await expect(page.getByText("Select user")).toBeVisible();
});
