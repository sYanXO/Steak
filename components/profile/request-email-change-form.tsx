"use client";

import { useActionState } from "react";
import { requestEmailChangeAction, type ProfileActionState } from "@/app/profile/actions";
import { Button } from "@/components/ui/button";

const initialState: ProfileActionState = {};

export function RequestEmailChangeForm() {
  const [state, formAction, pending] = useActionState(requestEmailChangeAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block text-sm font-medium">
        New email
        <input
          required
          type="email"
          name="nextEmail"
          className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
          placeholder="new-email@example.com"
        />
      </label>
      <FormFeedback state={state} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending OTP..." : "Send email change OTP"}
      </Button>
    </form>
  );
}

function FormFeedback({ state }: { state: ProfileActionState }) {
  if (state.error) {
    return (
      <p className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "var(--alert-error-border)", background: "var(--alert-error-bg)", color: "var(--alert-error-text)" }}>
        {state.error}
      </p>
    );
  }

  if (state.success) {
    return (
      <p className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "var(--alert-success-border)", background: "var(--alert-success-bg)", color: "var(--alert-success-text)" }}>
        {state.success}
      </p>
    );
  }

  return null;
}
