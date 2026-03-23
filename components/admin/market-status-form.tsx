"use client";

import { useActionState } from "react";
import { updateMarketStatusAction, type AdminMutationActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

const initialState: AdminMutationActionState = {};

type MarketStatusFormProps = {
  marketId: string;
  currentStatus: "DRAFT" | "OPEN" | "CLOSED" | "SETTLED" | "VOID";
};

export function MarketStatusForm({ marketId, currentStatus }: MarketStatusFormProps) {
  const action = updateMarketStatusAction.bind(null, marketId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const allowedStatuses = ["DRAFT", "OPEN", "CLOSED", "VOID"];

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <label className="block text-sm font-medium">
        Market status
        <select
          name="status"
          defaultValue={allowedStatuses.includes(currentStatus) ? currentStatus : "CLOSED"}
          className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
          disabled={currentStatus === "SETTLED"}
        >
          {allowedStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      {state.error ? (
        <p className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "var(--alert-error-border)", background: "var(--alert-error-bg)", color: "var(--alert-error-text)" }}>
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "var(--alert-success-border)", background: "var(--alert-success-bg)", color: "var(--alert-success-text)" }}>
          {state.success}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending || currentStatus === "SETTLED"}>
        {pending ? "Updating status..." : "Update status"}
      </Button>
    </form>
  );
}
