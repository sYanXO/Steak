import assert from "node:assert/strict";
import test from "node:test";
import {
  getErrorMessage,
  logActionError,
  logActionStart,
  logActionSuccess
} from "@/lib/observability";

test("getErrorMessage normalizes unknown values", () => {
  assert.equal(getErrorMessage(new Error("boom")), "boom");
  assert.equal(getErrorMessage("plain-error"), "plain-error");
  assert.equal(getErrorMessage(null, "fallback"), "fallback");
});

test("observability action logs emit structured event payloads", () => {
  const logs: Array<Record<string, unknown>> = [];
  const originalInfo = console.info;

  console.info = ((value: string) => {
    logs.push(JSON.parse(value) as Record<string, unknown>);
  }) as typeof console.info;

  try {
    logActionStart("admin.manual-top-up", { adminId: "admin-1" });
    logActionSuccess("admin.manual-top-up", { adminId: "admin-1", amount: 75 });
    logActionError("admin.manual-top-up", new Error("boom"), { adminId: "admin-1" });
  } finally {
    console.info = originalInfo;
  }

  assert.deepEqual(logs[0], {
    type: "event",
    name: "admin.manual-top-up",
    phase: "start",
    adminId: "admin-1"
  });
  assert.deepEqual(logs[1], {
    type: "event",
    name: "admin.manual-top-up",
    phase: "success",
    adminId: "admin-1",
    amount: 75
  });
  assert.deepEqual(logs[2], {
    type: "event",
    name: "admin.manual-top-up",
    phase: "error",
    message: "boom",
    adminId: "admin-1"
  });
});
