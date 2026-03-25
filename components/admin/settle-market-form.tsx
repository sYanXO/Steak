"use client";

import { useActionState, useEffect, useRef } from "react";
import { settleMarketAction, type SettleMarketActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { createClientRequestId } from "@/lib/client-request-id";

const initialState: SettleMarketActionState = {};

type SettleMarketFormProps = {
  marketId: string;
  outcomes: Array<{
    id: string;
    label: string;
  }>;
};

export function SettleMarketForm({ marketId, outcomes }: SettleMarketFormProps) {
  const action = settleMarketAction.bind(null, marketId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const requestIdRef = useRef(createClientRequestId());

  useEffect(() => {
    if (state.success) {
      requestIdRef.current = createClientRequestId();
    }
  }, [state.success]);

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <input type="hidden" name="requestId" value={requestIdRef.current} />
      <label className="block text-sm font-medium">
        Winning outcome
        <select
          name="outcomeId"
          defaultValue={outcomes[0]?.id}
          className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
        >
          {outcomes.map((outcome) => (
            <option key={outcome.id} value={outcome.id}>
              {outcome.label}
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

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Settling market..." : "Settle market"}
      </Button>
    </form>
  );
}
