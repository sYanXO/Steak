"use client";

import { useActionState } from "react";
import { updateAdminOwnProfileAction, type ProfileActionState } from "@/app/profile/actions";
import { Button } from "@/components/ui/button";

const initialState: ProfileActionState = {};

export function AdminProfileForm({
  defaultName,
  defaultEmail
}: {
  defaultName: string;
  defaultEmail: string;
}) {
  const [state, formAction, pending] = useActionState(updateAdminOwnProfileAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block text-sm font-medium">
        Name
        <input
          required
          type="text"
          name="name"
          defaultValue={defaultName}
          className="mt-2 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 outline-none"
        />
      </label>
      <label className="block text-sm font-medium">
        Email
        <input
          required
          type="email"
          name="email"
          defaultValue={defaultEmail}
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
        {pending ? "Saving profile..." : "Save admin profile"}
      </Button>
    </form>
  );
}
