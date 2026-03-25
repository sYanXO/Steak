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

test("admin can create a match and a market", async ({ page }) => {
  const stamp = Date.now();
  const homeTeam = `E2E Home ${stamp}`;
  const awayTeam = `E2E Away ${stamp}`;
  const matchTitle = `${homeTeam} vs ${awayTeam}`;
  const marketTitle = `E2E Market ${stamp}`;

  await signIn(page, "admin@stakeipl.app", "adminpass123");
  await page.goto("/admin");

  await page.getByLabel("Match title").fill(matchTitle);
  await page.getByLabel("Home team").fill(homeTeam);
  await page.getByLabel("Away team").fill(awayTeam);
  await page.getByLabel("Match start time").fill("2030-04-05T20:00");
  await page.getByRole("button", { name: "Create match" }).click();

  await expect(page.getByText(`Created match ${homeTeam} vs ${awayTeam}.`)).toBeVisible();
  await expect(page.getByText(matchTitle)).toBeVisible();

  const matchOption = page
    .locator('select[name="matchId"] option')
    .filter({ hasText: `${homeTeam} vs ${awayTeam}` });

  const matchId = await matchOption.first().getAttribute("value");

  expect(matchId).toBeTruthy();

  await page.locator('select[name="matchId"]').selectOption(matchId!);
  await page.getByLabel("Market title").fill(marketTitle);
  await page.getByLabel("Market type").fill("MATCH_WINNER");
  await page.getByLabel("Open time").fill("2030-04-05T18:00");
  await page.getByLabel("Close time").fill("2030-04-05T19:30");
  await page.getByLabel("Outcomes").fill(`${homeTeam}, ${awayTeam}`);
  await page.getByRole("button", { name: "Create market" }).click();

  await expect(page.getByText(`Created market ${marketTitle}.`)).toBeVisible();
});
