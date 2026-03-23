"use client";

import { useActionState } from "react";
import { verifyCredentialOtpAction, type ProfileActionState } from "@/app/profile/actions";
import { Button } from "@/components/ui/button";

const initialState: ProfileActionState = {};

export function VerifyOtpForm() {
  const [state, formAction, pending] = useActionState(verifyCredentialOtpAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block text-sm font-medium">
        Request ID
        <input
          required
          type="text"
          name="requestId"
          className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
          placeholder="Paste the request ID from the OTP response"
        />
      </label>
      <label className="block text-sm font-medium">
        6-digit OTP
        <input
          required
          type="text"
          name="otpCode"
          inputMode="numeric"
          pattern="[0-9]{6}"
          className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
          placeholder="123456"
        />
      </label>
      <FormFeedback state={state} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Verifying OTP..." : "Verify OTP"}
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
