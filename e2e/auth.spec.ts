import { expect, test } from "@playwright/test";
import { signIn, signOut } from "./helpers";

test("user can sign in to dashboard and sign out", async ({ page }) => {
  await signIn(page, "captain@stakeipl.app", "userpass123");

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Your active IPL position" })).toBeVisible();
  await expect(page.getByText("5,000")).toBeVisible();

  await signOut(page);
});

test("new user can register and receive starter balance", async ({ page }) => {
  const email = `verify-e2e-${Date.now()}@stakeipl.app`;

  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("E2E User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("verifypass123");
  await page.getByLabel("Confirm password").fill("verifypass123");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/sign-in\?registered=1$/);
  await expect(page.getByText("Account created. Sign in to access your starter balance.")).toBeVisible();

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("verifypass123");
  await page.getByRole("button", { name: "Continue with email" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("5,000")).toBeVisible();
});
