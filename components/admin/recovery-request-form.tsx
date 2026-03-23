"use client";

import { useActionState } from "react";
import { resolveRecoveryRequestAction, type AdminMutationActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

const initialState: AdminMutationActionState = {};

export function RecoveryRequestForm({
  requestId,
  requestedEmail
}: {
  requestId: string;
  requestedEmail: string;
}) {
  const action = resolveRecoveryRequestAction.bind(null, requestId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <label className="block text-sm font-medium">
        Approved replacement email
        <input
          required
          type="email"
          name="email"
          defaultValue={requestedEmail}
          className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
        />
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
        {pending ? "Resolving..." : "Resolve recovery request"}
      </Button>
    </form>
  );
}
