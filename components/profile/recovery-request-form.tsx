"use client";

import { useActionState } from "react";
import { createRecoveryRequestAction, type ProfileActionState } from "@/app/profile/actions";
import { Button } from "@/components/ui/button";

const initialState: ProfileActionState = {};

export function RecoveryRequestForm() {
  const [state, formAction, pending] = useActionState(createRecoveryRequestAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block text-sm font-medium">
        Requested email
        <input
          required
          type="email"
          name="requestedEmail"
          className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
          placeholder="new-email@example.com"
        />
      </label>
      <label className="block text-sm font-medium">
        Report details
        <textarea
          required
          name="reason"
          rows={4}
          className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
          placeholder="Explain the account access issue and why the email should be updated."
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
        {pending ? "Submitting request..." : "Submit recovery request"}
      </Button>
    </form>
  );
}
