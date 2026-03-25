import assert from "node:assert/strict";
import test from "node:test";
import {
  getAdminRedirect,
  getMarketUnavailableMessage,
  getSignInRedirect,
  getUserByIdRedirect,
  isMarketUnavailable
} from "@/lib/page-state";
import { THEME_STORAGE_KEY, themeScript } from "@/lib/theme";

test("admin redirect sends anonymous users to sign-in", () => {
  assert.equal(getAdminRedirect(null), "/sign-in");
});

test("admin redirect sends non-admin users to dashboard", () => {
  assert.equal(
    getAdminRedirect({
      user: {
        id: "user-1",
        email: "captain@stakeipl.app",
        role: "USER"
      }
    }),
    "/dashboard"
  );
});

test("admin redirect allows admins through", () => {
  assert.equal(
    getAdminRedirect({
      user: {
        id: "admin-1",
        email: "admin@stakeipl.app",
        role: "ADMIN"
      }
    }),
    null
  );
});

test("signed-in page redirect blocks anonymous sessions", () => {
  assert.equal(getSignInRedirect(null), "/sign-in");
  assert.equal(getUserByIdRedirect(null), "/sign-in");
});

test("signed-in page redirect allows valid user sessions", () => {
  assert.equal(
    getSignInRedirect({
      user: {
        id: "user-1",
        email: "captain@stakeipl.app"
      }
    }),
    null
  );
  assert.equal(
    getUserByIdRedirect({
      user: {
        id: "user-1"
      }
    }),
    null
  );
});

test("market lifecycle marks only voided and settled markets unavailable", () => {
  assert.equal(isMarketUnavailable("OPEN"), false);
  assert.equal(isMarketUnavailable("CLOSED"), false);
  assert.equal(isMarketUnavailable("VOID"), true);
  assert.equal(isMarketUnavailable("SETTLED"), true);
});

test("market lifecycle messages stay stable for voided and settled markets", () => {
  assert.equal(
    getMarketUnavailableMessage("VOID"),
    "This market is voided and no further stakes can be placed."
  );
  assert.equal(
    getMarketUnavailableMessage("SETTLED"),
    "This market has already been finalized."
  );
  assert.equal(getMarketUnavailableMessage("OPEN"), null);
});

test("theme bootstrap script uses the shared storage key and sets color scheme", () => {
  assert.match(themeScript, new RegExp(THEME_STORAGE_KEY));
  assert.match(themeScript, /root\.classList\.toggle\("dark", theme === "dark"\)/);
  assert.match(themeScript, /root\.style\.colorScheme = theme/);
});
