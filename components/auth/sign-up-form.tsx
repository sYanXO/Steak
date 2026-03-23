"use client";

import { useActionState } from "react";
import { signUpAction, type SignUpActionState } from "@/app/sign-up/actions";
import { Button } from "@/components/ui/button";

const initialState: SignUpActionState = {};

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block text-sm font-medium">
        Name
        <input
          required
          type="text"
          name="name"
          className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
          placeholder="Demo Player"
        />
      </label>
      <label className="block text-sm font-medium">
        Email
        <input
          required
          type="email"
          name="email"
          className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
          placeholder="captain@stakeipl.app"
        />
      </label>
      <label className="block text-sm font-medium">
        Password
        <input
          required
          type="password"
          name="password"
          minLength={8}
          className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
          placeholder="At least 8 characters"
        />
      </label>
      <label className="block text-sm font-medium">
        Confirm password
        <input
          required
          type="password"
          name="confirmPassword"
          minLength={8}
          className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
          placeholder="Repeat your password"
        />
      </label>

      {state.error ? (
        <p className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "var(--alert-error-border)", background: "var(--alert-error-bg)", color: "var(--alert-error-text)" }}>
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
