"use client";

import { useActionState } from "react";
import { requestPasswordChangeAction, type ProfileActionState } from "@/app/profile/actions";
import { Button } from "@/components/ui/button";

const initialState: ProfileActionState = {};

export function RequestPasswordChangeForm() {
  const [state, formAction, pending] = useActionState(requestPasswordChangeAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block text-sm font-medium">
        New password
        <input
          required
          type="password"
          name="nextPassword"
          minLength={8}
          className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
          placeholder="At least 8 characters"
        />
      </label>
      <label className="block text-sm font-medium">
        Confirm new password
        <input
          required
          type="password"
          name="confirmPassword"
          minLength={8}
          className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
          placeholder="Repeat your new password"
        />
      </label>
      <FormFeedback state={state} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending OTP..." : "Send password change OTP"}
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
